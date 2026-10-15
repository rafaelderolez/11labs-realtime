import {
  ShieldIcon,
  SpeedHighIcon,
  TranslateIcon,
  VoiceMidIcon,
} from "@/components/feature-icons"

const FEATURES = [
  {
    icon: TranslateIcon,
    text: "90+ output languages with Eleven v4 Turbo",
  },
  {
    icon: VoiceMidIcon,
    text: "Library voices or your own Instant or Professional Voice Clone",
  },
  {
    icon: SpeedHighIcon,
    text: "Configurable speed and accuracy per use case",
  },
  {
    icon: ShieldIcon,
    text: "Enterprise-grade security with SOC 2, PCI DSS Level 1 and ISO 27001",
  },
]

export function Features() {
  return (
    <section className="page-grid lines-hidden pt-10 pb-20 lg:pb-28">
      <ul className="col-edge grid grid-cols-subgrid gap-y-10">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="col-span-12 flex flex-col gap-3 px-content sm:col-span-6 lg:col-span-3"
          >
            <Icon className="size-4.5" />
            <p className="text-body-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
