import { useState } from "react"

import { LiveTranslationDemo } from "@/components/live-translation-demo"
import { TranslationSettings } from "@/components/translation-settings"
import { cn } from "@/lib/utils"

export function Bentos() {
  const [clipIndex, setClipIndex] = useState(0)

  return (
    <section id="demo" className="page-grid scroll-mt-10 pb-30">
      <div className="col-edge grid grid-cols-subgrid">
        <LiveTranslationDemo
          onClipChange={setClipIndex}
          className="col-span-12 h-90 md:h-120 lg:col-span-8 lg:row-start-1"
        />
        <Caption
          className="col-span-12 text-pretty max-lg:pb-16 lg:col-span-6 lg:col-start-1 lg:row-start-2"
          title="Choose any Voice"
        >
          Pick from our library of expressive, human-like voices, or use your
          own Instant or Professional Voice Clone. The voice stays consistent
          for the whole conversation.
        </Caption>
        <TranslationSettings
          clipIndex={clipIndex}
          className="col-span-12 h-120 lg:col-span-4 lg:col-start-9 lg:row-start-1"
        />
        <Caption
          className="col-span-12 lg:col-span-4 lg:col-start-9 lg:row-start-2"
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
