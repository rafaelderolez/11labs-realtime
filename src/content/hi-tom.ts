/** A greeting for Tom, played from the footer. Each one has its own voice. */
export type Greeting = {
  text: string
  /** Audio tag that steers the delivery; it isn't spoken. */
  tag: string
  voiceId: string
}

/** Every greeting is read in this accent, on top of its own tag. */
export const ACCENT = "over-the-top New Zealand accent"

// The footer plays these in turn, so every click sounds different.
export const GREETINGS: Greeting[] = [
  // Jessica – Playful, Bright, Warm.
  { text: "Hi Tom Parkes!", tag: "excited", voiceId: "cgSgspJ2msm6clMCkdW9" },
  // Chris – Charming, Down-to-Earth.
  { text: "Yo Tom!", tag: "casual", voiceId: "iP95p4xoKVk53GoZ742B" },
  // Laura – Enthusiast, Quirky Attitude.
  {
    text: "Hey Tom, what's up?",
    tag: "cheerful",
    voiceId: "FGY2WhTYpPnrIDTdsKH5",
  },
  // Brian – Deep, Resonant and Comforting.
  {
    text: "Tommy boy, how's it going?",
    tag: "playful",
    voiceId: "nPczCjzI2devNBz1zQrb",
  },
  // Mark – Natural Conversations (shared library).
  {
    text: "Tom! Raf says hi.",
    tag: "warm",
    voiceId: "UgBBYS2sOqTuMpoF3BR0",
  },
]

/** The clip's path under public/, named after its text. */
export function greetingPath({ text }: Greeting) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `/audio/hi-tom/${slug}.mp3`
}
