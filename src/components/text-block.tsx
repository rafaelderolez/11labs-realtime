import { PillButton } from "@/components/pill-button"

export function TextBlock() {
  return (
    <section className="page-grid divider-t gap-y-7 py-50">
      <h2 className="px-content font-heading text-heading lg:col-span-6 lg:col-from-1">
        Speak your language
        <span className="block text-tertiary-foreground">They hear theirs</span>
      </h2>
      <div className="flex flex-col items-start gap-8 px-content lg:col-span-5 lg:col-from-7 lg:px-0">
        <p className="text-title text-pretty">
          Eleven Realtime Translation turns live speech into expressive
          translated audio as people talk. Every conversation moves at its
          natural pace.
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
