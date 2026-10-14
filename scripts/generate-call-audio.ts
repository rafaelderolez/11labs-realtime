/**
 * Generates the translated-call clips and their word timings.
 *
 *   pnpm audio:call
 *
 * Each speaker's voice reads both their own line and its translation, so the
 * listener hears the same person in their own language. Writes the mp3s to
 * public/audio/call/ and the timings to src/lib/call-timings.json.
 */
import { CALL, SPEAKERS, clipPath } from "../src/lib/call-script.ts"
import { speak, writeTimings, type ClipTiming } from "./lib/speak.ts"

const timings: Record<string, ClipTiming> = {}

for (const turn of CALL) {
  const { voiceId } = SPEAKERS[turn.by]
  for (const part of ["said", "heard"] as const) {
    const path = clipPath(turn, part)
    timings[path] = await speak({ voiceId, text: turn[part], path })
  }
}

await writeTimings("src/lib/call-timings.json", timings)
