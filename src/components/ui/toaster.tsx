import { Toaster as Sonner } from "sonner"

// Sonner's own theme only knows light/dark/system, so the colours come from
// the page tokens instead and follow the `.dark` class with everything else.
const TOKEN_STYLE = {
  "--normal-bg": "var(--background)",
  "--normal-text": "var(--foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "var(--radius-xl)",
} as React.CSSProperties

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      style={TOKEN_STYLE}
      toastOptions={{
        classNames: {
          title: "!text-label-sm !font-normal",
          description: "!text-label-sm !text-muted-foreground",
        },
      }}
    />
  )
}
