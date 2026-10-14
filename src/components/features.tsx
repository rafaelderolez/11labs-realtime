import { Gauge, Languages, Mic, ShieldCheck } from "lucide-react"

const FEATURES = [
  {
    icon: Languages,
    text: "Output in 90+ languages with Eleven v4 Turbo",
  },
  {
    icon: Mic,
    text: "Expressive delivery in a voice you create or choose from our library.",
  },
  {
    icon: Gauge,
    text: "Configurable speed and accuracy per use case",
  },
  {
    icon: ShieldCheck,
    text: "Enterprise-grade security: SOC 2, PCI DSS Level 1, ISO 27001",
  },
]

export function Features() {
  return (
    <section className="page-grid lines-hidden pt-10 pb-28">
      <ul className="col-edge grid grid-cols-subgrid gap-y-7">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="col-span-12 flex flex-col gap-6 px-content sm:col-span-6 lg:col-span-3"
          >
            <Icon className="size-[18px]" strokeWidth={1.5} />
            <p className="text-body-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
