/**
 * Shared ElevenLabs text-to-speech helper for the audio generators. Reads the
 * key from ELEVENLABS_API_KEY (load it with `node --env-file=.env.local`).
 */
import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import type { ClipTiming, Word } from "../../src/lib/timings.ts"

const MODEL = "eleven_v4"
const SEED = 11

type Alignment = {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

const round = (n: number) => Math.round(n * 1000) / 1000

/**
 * Speaks `text` and writes it to `public${path}`. Optional audio tags such as
 * "excited" steer the delivery without being spoken or timed.
 */
export async function speak({
  voiceId,
  text,
  tag,
  path,
}: {
  voiceId: string
  text: string
  tag?: string | string[]
  path: string
}): Promise<ClipTiming> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set")

  const tags = [tag ?? []].flat()
  const prefix = tags.length ? `${tags.map((t) => `[${t}]`).join(" ")} ` : ""
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: prefix + text,
        model_id: MODEL,
        seed: SEED,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.2 },
      }),
    }
  )
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`)
  }
  const { audio_base64, alignment } = (await response.json()) as {
    audio_base64: string
    alignment: Alignment
  }
  if (alignment.characters.join("") !== prefix + text) {
    throw new Error(`Alignment drifted from the text for ${path}`)
  }

  await mkdir(dirname(`public${path}`), { recursive: true })
  await writeFile(`public${path}`, Buffer.from(audio_base64, "base64"))
  console.log(`✓ ${path}  ${prefix}${text}`)

  // Times stay relative to the start of the audio; the tag is skipped.
  const starts = alignment.character_start_times_seconds.slice(prefix.length)
  const words: Word[] = []
  let index = 0
  for (const word of text.split(" ")) {
    words.push([word, round(starts[index] ?? 0)])
    index += word.length + 1
  }
  return {
    duration: round(alignment.character_end_times_seconds.at(-1) ?? 0),
    words,
  }
}

export async function writeTimings(
  path: string,
  timings: Record<string, ClipTiming>
) {
  await writeFile(path, JSON.stringify(timings, null, 2) + "\n")
}
