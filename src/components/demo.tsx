import { TranslatedCall } from "@/components/translated-call"
import { TranslatedCallTurns } from "@/components/translated-call-turns"

export function Demo() {
  return (
    <section className="page-grid lines-hidden pt-10">
      <TranslatedCall className="col-edge" />
      <TranslatedCallTurns className="col-edge mt-10" />
    </section>
  )
}
