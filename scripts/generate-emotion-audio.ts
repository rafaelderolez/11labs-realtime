/**
 * Generates the emotion demo clips and their word timings.
 *
 *   pnpm audio:emotions            only new clips, or ones whose text changed
 *   pnpm audio:emotions --force    regenerate every clip
 *
 * The same voice and audio tag read the source line and its translation, so
 * the emotion carries across. Writes the mp3s to public/audio/emotions/ and
 * the timings to src/lib/emotion-timings.json.
 */
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"

import {
  EMOTION_CLIPS,
  EMOTION_VOICE_ID,
  emotionClipPath,
} from "../src/lib/emotion-script.ts"
import { speak, writeTimings, type ClipTiming } from "./lib/speak.ts"

const TIMINGS_PATH = "src/lib/emotion-timings.json"
const force = process.argv.includes("--force")

const existing: Record<string, ClipTiming> = existsSync(TIMINGS_PATH)
  ? JSON.parse(await readFile(TIMINGS_PATH, "utf8"))
  : {}
const timings: Record<string, ClipTiming> = {}

for (const clip of EMOTION_CLIPS) {
  for (const part of ["source", "translation"] as const) {
    const path = emotionClipPath(clip, part)
    const { text } = clip[part]
    const saved = existing[path]
    const current =
      saved?.words.map(([word]) => word).join(" ") === text &&
      existsSync(`public${path}`)
    if (!force && current) {
      timings[path] = existing[path]
      continue
    }
    timings[path] = await speak({
      voiceId: clip.voiceId ?? EMOTION_VOICE_ID,
      text,
      tag: clip.tag,
      path,
    })
  }
}

await writeTimings(TIMINGS_PATH, timings)
