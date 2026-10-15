/**
 * Generates the translated-call clips and their word timings.
 *
 *   pnpm audio:call
 *
 * Each speaker's voice reads both their own line and its translation, so the
 * listener hears the same person in their own language. Writes the mp3s to
 * public/audio/call/ and the timings to src/content/call-timings.json.
 */
import { CALL, SPEAKERS, clipPath } from "../src/content/call-script.ts"
import type { ClipTiming } from "../src/lib/timings.ts"
import { speak, writeTimings } from "./lib/speak.ts"

const timings: Record<string, ClipTiming> = {}

for (const turn of CALL) {
  const { voiceId } = SPEAKERS[turn.by]
  for (const part of ["said", "heard"] as const) {
    const path = clipPath(turn, part)
    timings[path] = await speak({ voiceId, text: turn[part], path })
  }
}

await writeTimings("src/content/call-timings.json", timings)
