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
          "bg-pill text-foreground shadow-[0_0_0_0.5px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:bg-pill-hover",
        className
      )}
      {...props}
    />
  )
}
