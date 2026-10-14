import { useId, useState } from "react"
import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { Globe } from "lucide-react"

import {
  Combobox,
  ComboboxItem,
  controlItem,
  controlPopup,
  controlTrigger,
} from "@/components/ui/combobox"
import { CommandGroup, CommandSeparator } from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VoicePicker, VoicePickerItem } from "@/components/ui/voice-picker"
import { EMOTION_CLIPS } from "@/lib/emotion-script"
import {
  LANGUAGES,
  VOICES,
  languageName,
  originalVoiceId,
  voicesFor,
  type Eagerness,
  type TranslateSettings,
} from "@/lib/translate-settings"
import { cn } from "@/lib/utils"

const AUTO = "auto"
const ORIGINAL = "original"

const EAGERNESS: { value: Eagerness; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

// Each language the demo can hear, and the clip that speaks it.
const INPUT_LANGUAGES = [
  ...new Map(EMOTION_CLIPS.map((clip, i) => [clip.source.lang, i])),
]

export function TranslationSettings({
  settings,
  onSettingsChange,
  className,
}: {
  settings: TranslateSettings
  onSettingsChange: (change: Partial<TranslateSettings>) => void
  className?: string
}) {
  const id = useId()
  const sourceLang = EMOTION_CLIPS[settings.clipIndex].source.lang
  // "Auto-detect" follows whichever clip plays; a picked language picks a clip.
  const [inputChoice, setInputChoice] = useState(AUTO)
  const input = inputChoice === sourceLang ? sourceLang : AUTO

  const original = VOICES.find(
    (v) => v.id === originalVoiceId(settings.clipIndex)
  )
  const voices = voicesFor(settings.outputLang)
  const selectedVoice = VOICES.find((v) => v.id === settings.voiceId)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [outputOpen, setOutputOpen] = useState(false)

  function pickVoice(voiceId: string | null) {
    onSettingsChange({ voiceId })
    setVoiceOpen(false)
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-hairline bg-surface p-6",
        className
      )}
    >
      <h3 id={`${id}-title`} className="sr-only">
        Translation settings
      </h3>

      <Field label="Input language" id={`${id}-input`}>
        <Select
          value={input}
          onValueChange={(value) => {
            const lang = value as string
            setInputChoice(lang)
            const clip = INPUT_LANGUAGES.find(([code]) => code === lang)
            if (clip) onSettingsChange({ clipIndex: clip[1] })
          }}
        >
          <SelectTrigger id={`${id}-input`} className={controlTrigger}>
            <SelectValue>
              {(value: string) => (
                <>
                  <Globe
                    className="size-4 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  {value === AUTO ? (
                    <span className="flex flex-1 justify-between gap-2">
                      Auto-detect
                      <span className="text-muted-foreground">
                        {languageName(sourceLang)}
                      </span>
                    </span>
                  ) : (
                    languageName(value)
                  )}
                </>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={controlPopup}>
            <SelectItem value={AUTO} className={controlItem}>
              Auto-detect
            </SelectItem>
            <SelectSeparator />
            {INPUT_LANGUAGES.map(([code]) => (
              <SelectItem key={code} value={code} className={controlItem}>
                {languageName(code)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Output language" id={`${id}-output`}>
        <Combobox
          id={`${id}-output`}
          open={outputOpen}
          onOpenChange={setOutputOpen}
          value={settings.outputLang}
          label={languageName(settings.outputLang)}
          placeholder="Search languages..."
          empty="No language found."
        >
          <CommandGroup>
            {/* Translating into the language being spoken isn't a translation. */}
            {LANGUAGES.filter((l) => l.code !== sourceLang).map((l) => (
              <ComboboxItem
                key={l.code}
                value={l.code}
                keywords={[l.name]}
                isSelected={settings.outputLang === l.code}
                onSelect={() => {
                  onSettingsChange({ outputLang: l.code })
                  setOutputOpen(false)
                }}
              >
                {l.name}
              </ComboboxItem>
            ))}
          </CommandGroup>
        </Combobox>
      </Field>

      <hr className="border-hairline" />

      <Field label="Voice" id={`${id}-voice`}>
        <VoicePicker
          id={`${id}-voice`}
          value={selectedVoice ?? original}
          selectedId={settings.voiceId ?? ORIGINAL}
          trigger={
            settings.voiceId
              ? selectedVoice?.name
              : `Original voice${original ? ` · ${original.name}` : ""}`
          }
          open={voiceOpen}
          onOpenChange={setVoiceOpen}
        >
          <CommandGroup>
            <VoicePickerItem
              voice={{
                id: ORIGINAL,
                name: "Original voice",
                description: `${original?.name ?? "The speaker"}, now in ${languageName(settings.outputLang)}`,
                previewUrl: original?.previewUrl,
              }}
              orbId={original?.id ?? ORIGINAL}
              isSelected={!settings.voiceId}
              onSelect={() => pickVoice(null)}
            />
          </CommandGroup>
          {voices.length ? <CommandSeparator /> : null}
          {voices.length ? (
            <CommandGroup>
              {voices.map((voice) => (
                <VoicePickerItem
                  key={voice.id}
                  voice={voice}
                  isSelected={settings.voiceId === voice.id}
                  onSelect={() => pickVoice(voice.id)}
                />
              ))}
            </CommandGroup>
          ) : null}
        </VoicePicker>
      </Field>

      <div className="flex flex-col gap-2">
        <p id={`${id}-eagerness`} className="text-label-sm text-foreground">
          Eagerness
        </p>
        <p
          id={`${id}-eagerness-hint`}
          className="text-body-sm text-muted-foreground"
        >
          How soon translation starts while the speaker is still talking. High
          starts sooner, low waits for the whole sentence.
        </p>
        <RadioGroup
          value={settings.eagerness}
          onValueChange={(value) =>
            onSettingsChange({ eagerness: value as Eagerness })
          }
          aria-labelledby={`${id}-eagerness`}
          aria-describedby={`${id}-eagerness-hint`}
          className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-1"
        >
          {EAGERNESS.map(({ value, label }) => (
            <Radio.Root
              key={value}
              value={value}
              className="flex h-8 items-center justify-center rounded-lg text-label-sm text-muted-foreground transition-[background-color,color,box-shadow] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-pill data-checked:text-foreground data-checked:shadow-[0_0_0_0.5px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]"
            >
              {label}
            </Radio.Root>
          ))}
        </RadioGroup>
      </div>
    </section>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-sm text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
