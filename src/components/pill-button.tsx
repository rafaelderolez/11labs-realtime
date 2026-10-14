import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PillButton({
  className,
  size = "lg",
  variant = "default",
  ...props
}: React.ComponentProps<typeof Button> & { size?: "sm" | "lg" }) {
  return (
    <Button
      variant={variant}
      className={cn(
        "gap-2 rounded-full font-normal transition-[background-color,color,box-shadow,border-color] active:scale-98 active:not-aria-[haspopup]:translate-y-0",
        size === "lg" ? "h-11 px-5 text-label" : "h-9 px-3.5 text-label-sm",
        variant === "secondary" &&
          "bg-pill text-foreground shadow-pill hover:bg-pill-hover",
        className
      )}
      {...props}
    />
  )
}
