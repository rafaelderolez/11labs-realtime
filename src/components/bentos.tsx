import { useState } from "react"

import { LiveTranslationDemo } from "@/components/live-translation-demo"
import { TranslationSettings } from "@/components/translation-settings"
import {
  DEFAULT_SETTINGS,
  updateSettings,
  type TranslateSettings,
} from "@/lib/translate-settings"
import { cn } from "@/lib/utils"

export function Bentos() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const change = (update: Partial<TranslateSettings>) =>
    setSettings((current) => updateSettings(current, update))

  return (
    <section id="demo" className="page-grid scroll-mt-10 pb-30">
      <div className="col-edge grid grid-cols-subgrid">
        <LiveTranslationDemo className="col-span-12 h-[480px] md:col-span-8" />
        <TranslationSettings
          settings={settings}
          onSettingsChange={change}
          className="col-span-12 max-md:mt-gutter md:col-span-4 md:col-start-9 md:row-start-1"
        />
        <Caption
          className="col-span-12 md:col-span-6 md:row-start-2"
          title="Choose any Voice"
        >
          Pick from our library of expressive, human-like voices, or use your
          own Instant or Professional Voice Clone. The voice stays consistent
          for the whole conversation.
        </Caption>
        <Caption
          className="col-span-12 md:col-span-4 md:col-start-9 md:row-start-2"
          title="Built for your use case"
        >
          Tune how quickly translation starts, from the highest quality output
          to the lowest latency to fit every conversation.
        </Caption>
      </div>
    </section>
  )
}

function Caption({
  className,
  title,
  children,
}: {
  className?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-4 px-content pt-6", className)}>
      <p className="truncate text-body">{title}</p>
      <p className="text-body-sm text-muted-foreground">{children}</p>
    </div>
  )
}
