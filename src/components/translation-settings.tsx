import { Globe } from "lucide-react"
import { useId } from "react"

import { LanguageFlag } from "@/components/ui/language-picker"
import { VoiceSwatch } from "@/components/ui/voice-picker"
import { EMOTION_CLIPS } from "@/lib/emotion-script"
import {
  VOICES,
  languageName,
  originalVoiceId,
  voiceLabel,
} from "@/lib/translate-settings"
import { cn } from "@/lib/utils"

const EAGERNESS = ["Low", "Medium", "High"]
/** The demo's one-second translation delay is the medium setting. */
const DEMO_EAGERNESS = "Medium"

/**
 * The settings behind the clip the demo is playing. It describes the demo
 * rather than configuring it, so the values look like fields but none of
 * them is a control.
 */
export function TranslationSettings({
  clipIndex,
  className,
}: {
  clipIndex: number
  className?: string
}) {
  const id = useId()
  const clip = EMOTION_CLIPS[clipIndex]
  const voiceId = originalVoiceId(clipIndex)
  const voice = VOICES.find((v) => v.id === voiceId)

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden rounded-2xl border border-hairline p-6",
        className
      )}
    >
      <img
        src="/grain-1.jpg"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 size-full object-cover"
      />
      <h3 id={`${id}-title`} className="sr-only">
        Translation settings for this clip
      </h3>

      {/* Built at product size and zoomed down, like the reference screenshot. */}
      <div className="flex w-100 shrink-0 [zoom:0.7] flex-col gap-4 rounded-xl border border-surface-faint bg-card p-4 shadow-panel">
        <Field label="Input language">
          <Globe className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="flex flex-1 justify-between gap-2">
            Auto-detect
            <span className="text-muted-foreground">
              {languageName(clip.source.lang)}
            </span>
          </span>
        </Field>

        <Field label="Output language">
          <LanguageFlag code={clip.translation.lang} />
          {languageName(clip.translation.lang)}
        </Field>

        <hr className="border-hairline" />

        <Field label="Voice">
          <VoiceSwatch id={voiceId} className="size-5" />
          {voice && <span className="truncate">{voiceLabel(voice)}</span>}
        </Field>

        <dl className="flex flex-col gap-1.5">
          <dt className="text-label-sm text-foreground">Eagerness</dt>
          <dd className="text-body-sm text-muted-foreground">
            <span className="sr-only">{DEMO_EAGERNESS}. </span>
            Translation starts while speaking. High means sooner, low waits
            longer for quality.
          </dd>
          <dd
            aria-hidden
            className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-foreground/4 p-1"
          >
            {EAGERNESS.map((level) => (
              <span
                key={level}
                className={cn(
                  "flex h-7 items-center justify-center rounded-md text-label-sm",
                  level === DEMO_EAGERNESS
                    ? "bg-pill text-foreground shadow-pill"
                    : "text-muted-foreground"
                )}
              >
                {level}
              </span>
            ))}
          </dd>
        </dl>
      </div>
    </section>
  )
}

/** A setting's value, shaped like the picker it would be in the product. */
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <dl className="flex flex-col gap-1.5">
      <dt className="text-label-sm text-foreground">{label}</dt>
      <dd className="flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-hairline bg-pill px-2.5 text-label-sm shadow-2xs">
        {children}
      </dd>
    </dl>
  )
}
