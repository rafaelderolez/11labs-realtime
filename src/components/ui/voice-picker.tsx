// Adapted from ElevenLabs UI (https://ui.elevenlabs.io/docs/components/voice-picker):
// a static swatch in the colors the voice's orb would use.

import { cn } from "@/lib/utils"

function hash(id: string) {
  let h = 0
  for (const char of id) h = (h * 31 + char.charCodeAt(0)) | 0
  return Math.abs(h)
}

function orbColors(id: string): [string, string] {
  const hue = hash(id) % 360
  return [`oklch(0.88 0.06 ${hue})`, `oklch(0.78 0.08 ${(hue + 60) % 360})`]
}

function VoiceSwatch({ id, className }: { id: string; className?: string }) {
  const [from, to] = orbColors(id)
  return (
    <span
      aria-hidden
      className={cn("size-4 shrink-0 rounded-full", className)}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${from}, ${to})`,
      }}
    />
  )
}

export { VoiceSwatch }
