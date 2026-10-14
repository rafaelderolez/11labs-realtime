import { PillButton } from "@/components/pill-button"

export function Hero() {
  return (
    <section className="page-grid lines-hidden gap-y-8 pt-20 pb-10">
      <h1 className="px-content font-heading text-display sm:col-span-6 sm:col-from-1 sm:self-end">
        Natural live translation
        <span className="block text-[#999]">with Eleven Realtime</span>
      </h1>
      <p className="px-content text-body sm:col-span-6 sm:col-from-7 sm:self-end">
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
