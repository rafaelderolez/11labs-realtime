import { useId, useState } from "react"
import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { Globe } from "lucide-react"

import { Combobox, ComboboxItem } from "@/components/ui/combobox"
import { CommandGroup, CommandSeparator } from "@/components/ui/command"
import {
  LanguageFlag,
  LanguagePicker,
  LanguagePickerGroup,
  LanguagePickerItem,
} from "@/components/ui/language-picker"
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
  // Output languages picked this session, newest first.
  const [recentOutputs, setRecentOutputs] = useState([settings.outputLang])
  const [outputOpen, setOutputOpen] = useState(false)
  const outputLanguages = LANGUAGES.filter((l) => l.code !== sourceLang)

  function pickOutput(lang: string) {
    onSettingsChange({ outputLang: lang })
    setRecentOutputs((recent) =>
      [lang, ...recent.filter((code) => code !== lang)].slice(0, 3)
    )
    setOutputOpen(false)
  }

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
        <LanguagePicker
          id={`${id}-input`}
          value={input}
          onValueChange={(lang) => {
            setInputChoice(lang)
            const clip = INPUT_LANGUAGES.find(([code]) => code === lang)
            if (clip) onSettingsChange({ clipIndex: clip[1] })
          }}
          trigger={
            input === AUTO ? (
              <>
                <AutoIcon />
                <span className="flex flex-1 justify-between gap-2">
                  Auto-detect
                  <span className="text-muted-foreground">
                    {languageName(sourceLang)}
                  </span>
                </span>
              </>
            ) : (
              <>
                <LanguageFlag code={input} />
                {languageName(input)}
              </>
            )
          }
        >
          <LanguagePickerGroup label="Default">
            <LanguagePickerItem value={AUTO} icon={<AutoIcon />}>
              Auto (Recommended)
            </LanguagePickerItem>
          </LanguagePickerGroup>
          <LanguagePickerGroup label="All Languages">
            {INPUT_LANGUAGES.map(([code]) => (
              <LanguagePickerItem key={code} value={code}>
                {languageName(code)}
              </LanguagePickerItem>
            ))}
          </LanguagePickerGroup>
        </LanguagePicker>
      </Field>

      <Field label="Output language" id={`${id}-output`}>
        <Combobox
          id={`${id}-output`}
          open={outputOpen}
          onOpenChange={setOutputOpen}
          // Highlight the recent entry so the list opens at the top.
          value={
            recentOutputs.includes(settings.outputLang)
              ? `recent-${settings.outputLang}`
              : settings.outputLang
          }
          icon={<LanguageFlag code={settings.outputLang} />}
          label={languageName(settings.outputLang)}
          placeholder="Search languages..."
          empty="No language found."
        >
          {/* Translating into the language being spoken isn't a translation. */}
          {recentOutputs.some((code) => code !== sourceLang) ? (
            <CommandGroup heading="Recently Used" className={languageGroup}>
              {recentOutputs
                .filter((code) => code !== sourceLang)
                .map((code) => (
                  <OutputItem
                    key={code}
                    // cmdk keys items by value, so the repeat needs its own.
                    value={`recent-${code}`}
                    code={code}
                    isSelected={settings.outputLang === code}
                    onPick={pickOutput}
                  />
                ))}
            </CommandGroup>
          ) : null}
          <CommandGroup heading="All Languages" className={languageGroup}>
            {outputLanguages.map((l) => (
              <OutputItem
                key={l.code}
                value={l.code}
                code={l.code}
                isSelected={settings.outputLang === l.code}
                onPick={pickOutput}
              />
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
          Translation starts while speaking. High means sooner, low waits longer
          for quality.
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

/** Matches the Language picker's section labels. */
const languageGroup =
  "p-0 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-label-sm! **:[[cmdk-group-heading]]:font-normal!"

function OutputItem({
  value,
  code,
  isSelected,
  onPick,
}: {
  value: string
  code: string
  isSelected: boolean
  onPick: (code: string) => void
}) {
  return (
    <ComboboxItem
      value={value}
      keywords={[languageName(code)]}
      isSelected={isSelected}
      onSelect={() => onPick(code)}
    >
      <LanguageFlag code={code} />
      {languageName(code)}
    </ComboboxItem>
  )
}

function AutoIcon() {
  return <Globe className="size-4 shrink-0" strokeWidth={1.75} />
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
