/**
 * Generates the footer's greetings for Tom.
 *
 *   pnpm audio:hi-tom            only clips that don't exist yet
 *   pnpm audio:hi-tom --force    regenerate every clip
 *
 * Clips are named after their text, so editing a line makes a new clip.
 * Writes the mp3s to public/audio/hi-tom/.
 */
import { existsSync } from "node:fs"

import { ACCENT, GREETINGS, greetingPath } from "../src/content/hi-tom.ts"
import { speak } from "./lib/speak.ts"

const force = process.argv.includes("--force")

for (const greeting of GREETINGS) {
  const path = greetingPath(greeting)
  if (!force && existsSync(`public${path}`)) continue
  await speak({ ...greeting, tag: [ACCENT, greeting.tag], path })
}
