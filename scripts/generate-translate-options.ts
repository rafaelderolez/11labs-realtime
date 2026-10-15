/**
 * Builds the output languages and voices offered in the translation settings.
 *
 *   pnpm translate:options
 *
 * Languages are the ones the agent's TTS model can speak. Voices are the
 * account's voices plus a few popular library voices per language, each with
 * the languages ElevenLabs has verified it for, so the settings only offer a
 * voice for languages it's known to speak well. Writes
 * src/content/translate-options.json.
 */
import { writeFile } from "node:fs/promises"

const MODEL = "eleven_v4_turbo"
/** Library voices to add per language, on top of the account's own. */
const LIBRARY_VOICES_PER_LANGUAGE = 3

const apiKey = process.env.ELEVENLABS_API_KEY
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set")

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.elevenlabs.io${path}`, {
    headers: { "xi-api-key": apiKey! },
  })
  if (!response.ok) {
    throw new Error(`${path}: ${response.status} ${await response.text()}`)
  }
  return response.json() as Promise<T>
}

type Language = { code: string; name: string }

type Voice = {
  id: string
  name: string
  description: string
  previewUrl: string | null
  languages: string[]
}

type ApiVoice = {
  voice_id: string
  name: string
  preview_url?: string | null
  verified_languages?: { language: string; preview_url?: string | null }[]
}

type ApiSharedVoice = {
  voice_id: string
  name: string
  language?: string
  preview_url?: string | null
  verified_languages?: { language: string; preview_url?: string | null }[]
}

// "Lucas – Premium French Corporate Narrator" → name and description.
function splitName(full: string) {
  const [name, ...rest] = full.split(/\s+[-–]\s+/)
  return { name: name.trim(), description: rest.join(" – ").trim() }
}

const models =
  await get<
    { model_id: string; languages: { language_id: string; name: string }[] }[]
  >("/v1/models")
const model = models.find((m) => m.model_id === MODEL)
if (!model) throw new Error(`${MODEL} isn't available on this account`)

const languages: Language[] = model.languages
  .map(({ language_id, name }) => ({ code: language_id, name }))
  .sort((a, b) => a.name.localeCompare(b.name))
const supported = new Set(languages.map((l) => l.code))

const voices = new Map<string, Voice>()
function addVoice(v: ApiVoice | ApiSharedVoice) {
  const verified = (v.verified_languages ?? [])
    .map((l) => l.language)
    .filter((code) => supported.has(code))
  const languages = [...new Set(verified)]
  if (!languages.length) return
  const existing = voices.get(v.voice_id)
  if (existing) {
    existing.languages = [...new Set([...existing.languages, ...languages])]
    return
  }
  voices.set(v.voice_id, {
    id: v.voice_id,
    ...splitName(v.name),
    previewUrl: v.preview_url ?? null,
    languages,
  })
}

const own = await get<{ voices: ApiVoice[] }>("/v2/voices?page_size=100")
own.voices.forEach(addVoice)

for (const { code, name } of languages) {
  const shared = await get<{ voices: ApiSharedVoice[] }>(
    `/v1/shared-voices?page_size=${LIBRARY_VOICES_PER_LANGUAGE}&language=${code}&sort=usage_character_count_1y`
  )
  shared.voices.forEach(addVoice)
  process.stdout.write(`${name} `)
}

await writeFile(
  "src/content/translate-options.json",
  JSON.stringify(
    { model: MODEL, languages, voices: [...voices.values()] },
    null,
    2
  ) + "\n"
)
console.log(`\n✓ ${languages.length} languages, ${voices.size} voices`)
