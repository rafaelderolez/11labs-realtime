import { PillButton } from "@/components/ui/pill-button"

export function TextBlock() {
  return (
    <section className="page-grid divider-t gap-y-7 py-20 lg:py-50">
      <h2 className="px-content font-heading text-heading text-trim lg:col-span-6 lg:col-from-1">
        It translates the tone
        <span className="block text-tertiary-foreground">
          Not just the words
        </span>
      </h2>
      <div className="flex flex-col items-start gap-10 px-content lg:col-span-5 lg:col-from-7 lg:px-0">
        <p className="text-body text-pretty text-trim sm:text-title">
          Emotion, emphasis and pacing carry into the translated voice.
          Translation starts mid-sentence, so nobody waits.
        </p>
        <PillButton
          variant="secondary"
          onClick={() => document.getElementById("demo")?.scrollIntoView()}
        >
          Try the demo
        </PillButton>
      </div>
    </section>
  )
}
