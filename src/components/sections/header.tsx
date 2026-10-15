import { Logo } from "@/components/logo"
import { PillButton } from "@/components/ui/pill-button"

const NAV_ITEMS = [
  "Products",
  "Solutions",
  "Customers",
  "Resources",
  "Enterprise",
  "Pricing",
]

export function Header() {
  return (
    <header className="page-grid lines-hidden h-16 items-center">
      <nav className="col-outer flex items-center justify-between">
        <div className="flex items-center gap-9">
          <Logo className="h-4 w-auto" />
          <ul className="hidden items-center lg:flex">
            {NAV_ITEMS.map((item) => (
              <li
                key={item}
                className="px-3 text-label-sm text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <PillButton
            size="sm"
            variant="secondary"
            className="hidden sm:inline-flex"
          >
            Contact Sales
          </PillButton>
          <PillButton size="sm">Login</PillButton>
        </div>
      </nav>
    </header>
  )
}
