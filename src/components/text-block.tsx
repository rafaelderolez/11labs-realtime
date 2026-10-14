import { PillButton } from "@/components/pill-button"

export function TextBlock() {
  return (
    <section className="page-grid divider-t gap-y-7 py-50">
      <h2 className="px-content font-heading text-heading lg:col-span-6 lg:col-from-1">
        You do you, I do me
        <span className="block text-foreground/40">
          Eleven Realtime handles the rest
        </span>
      </h2>
      <div className="flex flex-col items-start gap-8 px-content lg:col-span-6 lg:col-from-7">
        <p className="text-title">
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
