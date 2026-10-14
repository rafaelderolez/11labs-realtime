import { PillButton } from "@/components/pill-button"

export function Hero() {
  return (
    <section className="page-grid lines-hidden gap-y-7 pt-20 pb-10 xl:gap-y-10">
      <h1 className="px-content font-heading text-display text-trim xl:col-span-6 xl:col-from-1 xl:self-baseline-last">
        Natural live translation
        <span className="block text-tertiary-foreground">
          with Eleven Realtime
        </span>
      </h1>
      <p className="max-w-xl px-content text-body text-pretty text-trim xl:col-span-6 xl:col-from-7 xl:max-w-none xl:self-baseline-last">
        Eleven Realtime Translate turns live speech into natural, expressive
        translated audio as people talk. Each person speaks their own language
        and hears the other in theirs.
      </p>
      <div className="col-edge mt-4 flex flex-wrap gap-3 px-content xl:mt-0">
        <PillButton>Contact Sales</PillButton>
        <PillButton variant="secondary">Read documentation</PillButton>
      </div>
    </section>
  )
}
