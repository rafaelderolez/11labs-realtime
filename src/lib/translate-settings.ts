import { EMOTION_CLIPS, EMOTION_VOICE_ID } from "@/content/emotion-script"
import OPTIONS from "@/content/translate-options.json"

export type Voice = (typeof OPTIONS.voices)[number]

const LANGUAGES = OPTIONS.languages
export const VOICES: Voice[] = OPTIONS.voices

const LANGUAGE_NAMES = new Map(LANGUAGES.map((l) => [l.code, l.name]))

export function languageName(code: string) {
  return LANGUAGE_NAMES.get(code) ?? code.toUpperCase()
}

/** The voice that spoke the clip, which can speak any output language. */
export function originalVoiceId(clipIndex: number) {
  return EMOTION_CLIPS[clipIndex].voiceId ?? EMOTION_VOICE_ID
}

/** The voice's library name, e.g. "Brian - Deep, Resonant and Comforting". */
export function voiceLabel(voice: Voice) {
  return voice.description ? `${voice.name} - ${voice.description}` : voice.name
}
