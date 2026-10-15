import { toast } from "sonner"

// These buttons are deliberately not wired up: this is a concept page, not
// the product. A toast owns up to it instead of a click that does nothing.
export function placeholderToast() {
  toast("I didn’t hook this one up", {
    id: "placeholder",
    description: "But here’s a toast. Hopefully that makes up for it.",
  })
}
