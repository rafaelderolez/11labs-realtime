import { EMOTION_CLIPS, EMOTION_VOICE_ID } from "@/lib/emotion-script"
import OPTIONS from "@/lib/translate-options.json"

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
