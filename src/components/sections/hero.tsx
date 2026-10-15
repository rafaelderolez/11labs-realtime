import { PillButton } from "@/components/ui/pill-button"
import { placeholderToast } from "@/lib/placeholder-toast"

// Small on phones so both buttons fit on one row, large from `sm` up.
const LARGE_FROM_SM = "sm:h-11 sm:px-5 sm:text-label"

export function Hero() {
  return (
    <section className="page-grid lines-hidden gap-y-7 pt-20 pb-10 xl:gap-y-10">
      <h1 className="px-content font-heading text-display text-trim xl:col-span-6 xl:col-from-1 xl:self-baseline-last">
        Natural live translation
        <span className="block text-tertiary-foreground">
          with Eleven Realtime
        </span>
      </h1>
      <p className="max-w-xl px-content text-body text-pretty text-trim xl:col-span-6 xl:col-from-7 xl:max-w-none xl:self-baseline-last xl:pl-0">
        Eleven Realtime Translate turns speech into translated audio while
        people talk. Each person speaks their own language and hears the other
        in theirs, across more than 90 languages.
      </p>
      <div className="col-edge mt-3 flex flex-wrap gap-2 px-content sm:gap-3 xl:mt-0">
        <PillButton
          size="sm"
          className={LARGE_FROM_SM}
          onClick={placeholderToast}
        >
          Contact sales
        </PillButton>
        <PillButton
          size="sm"
          variant="secondary"
          className={LARGE_FROM_SM}
          onClick={placeholderToast}
        >
          Read documentation
        </PillButton>
      </div>
    </section>
  )
}
