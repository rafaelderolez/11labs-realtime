import { Logo } from "@/components/logo"
import { PillButton } from "@/components/ui/pill-button"
import { placeholderToast } from "@/lib/placeholder-toast"

const NAV_ITEMS = [
  "Products",
  "Solutions",
  "Customers",
  "Resources",
  "Enterprise",
  "Pricing",
]

// On phones Log in sits close to the logo and reads as a link; on desktop it
// stays a filled pill so it doesn't float alone at the far edge.
const LOGIN_GHOST_BELOW_LG =
  "max-lg:-mr-3.5 max-lg:bg-transparent max-lg:text-foreground max-lg:hover:bg-muted dark:max-lg:hover:bg-muted/50"

export function Header() {
  return (
    <header className="page-grid lines-hidden h-16 items-center">
      <nav className="flex items-center justify-between px-content lg:col-outer lg:px-0">
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
        {/* Below `lg`, pulled out by its padding so the label sits on the content edge. */}
        <PillButton
          size="sm"
          className={LOGIN_GHOST_BELOW_LG}
          onClick={placeholderToast}
        >
          Log in
        </PillButton>
      </nav>
    </header>
  )
}
