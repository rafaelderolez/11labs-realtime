/** Default voice for the clips: Jessica – Playful, Bright, Warm. */
export const EMOTION_VOICE_ID = "cgSgspJ2msm6clMCkdW9"

type Utterance = { lang: string; text: string }

export type EmotionClip = {
  emotion: string
  /** Audio tag that steers the delivery; it isn't spoken. */
  tag: string
  /** Reads both the source and its translation; defaults to EMOTION_VOICE_ID. */
  voiceId?: string
  source: Utterance
  translation: Utterance
}

// Each pair starts from a different language, and the translation keeps the
// emotion of the source, which is the point. French punctuation keeps its
// non-breaking space so "?" and "!" never orphan.
export const EMOTION_CLIPS: EmotionClip[] = [
  {
    emotion: "Excited",
    tag: "excited",
    source: {
      lang: "nl",
      text: "We hebben vandaag de sleutels van ons nieuwe huis gekregen!",
    },
    translation: {
      lang: "en",
      text: "We got the keys to the new place today!",
    },
  },
  {
    emotion: "Hopeful",
    tag: "hopeful",
    // Mark – Natural Conversations (shared library).
    voiceId: "UgBBYS2sOqTuMpoF3BR0",
    source: { lang: "en", text: "I really think this could work for us." },
    translation: {
      lang: "it",
      text: "Credo davvero che possa funzionare per noi.",
    },
  },
  {
    emotion: "Tired",
    tag: "tired",
    // Brian – Deep, Resonant and Comforting.
    voiceId: "nPczCjzI2devNBz1zQrb",
    source: { lang: "de", text: "Langer Tag. Können wir morgen weitermachen?" },
    translation: {
      lang: "en",
      text: "Long day. Can we pick this up tomorrow?",
    },
  },
  {
    emotion: "Angry",
    tag: "angry",
    // Laura – Enthusiast, Quirky Attitude.
    voiceId: "FGY2WhTYpPnrIDTdsKH5",
    source: {
      lang: "en",
      text: "This is the third time my order’s been wrong.",
    },
    translation: {
      lang: "fr",
      text: "C’est la troisième fois que ma commande est fausse.",
    },
  },
  {
    // A Spanish mother-in-law to Thomas, in her own voice both times.
    emotion: "Loving",
    tag: "affectionate",
    // Rosa – Spanish Calm Old Woman (peninsular Spanish, shared library).
    voiceId: "ypIbR1aohyRSdDv25DPr",
    source: {
      lang: "es",
      text: "¡Ay, Thomasito! Eres el mejor yerno del mundo.",
    },
    translation: {
      lang: "en",
      text: "Oh, Thomasito! You’re the best son-in-law in the world.",
    },
  },
]

export function emotionClipPath(
  clip: EmotionClip,
  part: "source" | "translation"
) {
  return `/audio/emotions/${clip.tag}-${clip[part].lang}.mp3`
}
