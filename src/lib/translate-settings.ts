import { EMOTION_CLIPS, EMOTION_VOICE_ID } from "@/lib/emotion-script"
import OPTIONS from "@/lib/translate-options.json"

export type Eagerness = "low" | "medium" | "high"

export type TranslateSettings = {
  /** Which demo clip is the input; its language is what "Auto-detect" finds. */
  clipIndex: number
  outputLang: string
  /** null keeps the speaker's own voice. */
  voiceId: string | null
  eagerness: Eagerness
}

export type Voice = (typeof OPTIONS.voices)[number]

export const LANGUAGES = OPTIONS.languages
export const VOICES: Voice[] = OPTIONS.voices

const LANGUAGE_NAMES = new Map(LANGUAGES.map((l) => [l.code, l.name]))

export function languageName(code: string) {
  return LANGUAGE_NAMES.get(code) ?? code.toUpperCase()
}

/** The voice that spoke the clip, which can speak any output language. */
export function originalVoiceId(clipIndex: number) {
  return EMOTION_CLIPS[clipIndex].voiceId ?? EMOTION_VOICE_ID
}

export function voicesFor(lang: string) {
  return VOICES.filter((voice) => voice.languages.includes(lang))
}

export const DEFAULT_SETTINGS: TranslateSettings = {
  clipIndex: 0,
  outputLang: EMOTION_CLIPS[0].translation.lang,
  voiceId: null,
  eagerness: "medium",
}

/**
 * Applies a change and keeps the rest valid: the output can't match the input
 * language, and a chosen voice has to speak the output language.
 */
export function updateSettings(
  current: TranslateSettings,
  change: Partial<TranslateSettings>
): TranslateSettings {
  const next = { ...current, ...change }
  const clip = EMOTION_CLIPS[next.clipIndex]
  if (next.outputLang === clip.source.lang) {
    next.outputLang = clip.translation.lang
  }
  if (
    next.voiceId &&
    !voicesFor(next.outputLang).some((voice) => voice.id === next.voiceId)
  ) {
    next.voiceId = null
  }
  return next
}
