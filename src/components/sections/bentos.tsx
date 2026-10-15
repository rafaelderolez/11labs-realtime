import { useState } from "react"

import { LiveTranslationDemo } from "@/components/demos/live-translation-demo"
import { TranslationSettings } from "@/components/demos/translation-settings"
import { cn } from "@/lib/utils"

export function Bentos() {
  const [clipIndex, setClipIndex] = useState(0)

  return (
    <section id="demo" className="page-grid scroll-mt-10 pb-16 lg:pb-28">
      <div className="col-edge grid grid-cols-subgrid">
        <LiveTranslationDemo
          onClipChange={setClipIndex}
          className="col-span-12 md:h-120 lg:col-span-8 lg:row-start-1"
        />
        <Caption
          className="col-span-12 text-pretty max-lg:pb-16 lg:col-span-6 lg:col-start-1 lg:row-start-2"
          title="Choose any voice"
        >
          Pick an emotion to hear it in action. Whichever voice you choose
          speaks the translation with the feeling of the original.
        </Caption>
        <TranslationSettings
          clipIndex={clipIndex}
          className="col-span-12 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:h-120"
        />
        <Caption
          className="col-span-12 lg:col-span-4 lg:col-start-9 lg:row-start-2"
          title="Tuned to the conversation"
        >
          Raise eagerness for quick back-and-forth like support calls. Lower it
          where every word counts, like medical or legal consultations.
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
    <div className={cn("flex flex-col gap-3 px-content pt-6", className)}>
      <p className="truncate text-body">{title}</p>
      <p className="text-body-sm text-muted-foreground">{children}</p>
    </div>
  )
}
