import { PillButton } from "@/components/pill-button"

export function Hero() {
  return (
    <section className="page-grid lines-hidden gap-y-8 pt-20 pb-10">
      <h1 className="px-content font-heading text-display xl:col-span-6 xl:col-from-1 xl:self-end">
        Natural live translation
        <span className="block text-tertiary-foreground">
          with Eleven Realtime
        </span>
      </h1>
      <p className="max-w-xl px-content text-body text-pretty xl:col-span-6 xl:col-from-7 xl:max-w-none xl:self-end">
        Eleven Realtime Translate turns live speech into natural, expressive
        translated audio as people talk. Each person speaks their own language
        and hears the other in theirs.
      </p>
      <div className="col-edge flex flex-wrap gap-2 px-content">
        <PillButton>Contact Sales</PillButton>
        <PillButton variant="secondary">Read documentation</PillButton>
      </div>
    </section>
  )
}
