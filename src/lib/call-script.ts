export type Side = "left" | "right"

export type Speaker = {
  name: string
  lang: string
  language: string
  /** ElevenLabs voice that speaks both their own lines and their translations. */
  voiceId: string
}

export const SPEAKERS: Record<Side, Speaker> = {
  // Mylène – Spontaneous and Casual (shared library).
  left: {
    name: "Camille",
    lang: "fr",
    language: "Français",
    voiceId: "WQKwBV2Uzw1gSGr69N8I",
  },
  // Chris – Charming, Down-to-Earth.
  right: {
    name: "James",
    lang: "en",
    language: "English",
    voiceId: "iP95p4xoKVk53GoZ742B",
  },
}

/** One line of the call: what was said, and what the other side hears. */
export type Turn = { id: string; by: Side; said: string; heard: string }

// French punctuation keeps its non-breaking space so "?" never orphans.
export const CALL: Turn[] = [
  {
    id: "01",
    by: "right",
    said: "Riverside Clinic, this is James. How can I help?",
    heard: "Clinique Riverside, ici James. Comment puis-je vous aider?",
  },
  {
    id: "02",
    by: "left",
    said: "Bonjour, j’aimerais prendre rendez-vous pour ma fille.",
    heard: "Hi, I’d like to book an appointment for my daughter.",
  },
  {
    id: "03",
    by: "right",
    said: "Of course. Does tomorrow morning work?",
    heard: "Bien sûr. Demain matin, ça vous va?",
  },
  {
    id: "04",
    by: "left",
    said: "Parfait. Vers dix heures?",
    heard: "Perfect. Around ten?",
  },
  {
    id: "05",
    by: "right",
    said: "Ten it is. See you tomorrow.",
    heard: "Dix heures, c’est noté. À demain.",
  },
]

/** Where a line's audio lives, relative to `public/`. */
export function clipPath(turn: Turn, part: "said" | "heard") {
  return `/audio/call/${turn.id}-${part}.mp3`
}
