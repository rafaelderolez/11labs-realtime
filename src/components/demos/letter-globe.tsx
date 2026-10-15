import { useEffect, useRef } from "react"

import { BURSTS, IDLE, MOODS, burst, type Mood } from "@/lib/letter-globe/moods"
import { drawGlobe } from "@/lib/letter-globe/render"
import { buildLetters, type Letter } from "@/lib/letter-globe/shapes"
import { cn } from "@/lib/utils"

/** Always animates; callers skip rendering it under reduced motion. */
export function LetterGlobe({
  emotion,
  active,
  clipTime,
  className,
}: {
  emotion: string
  /** Takes on the emotion only while its clip plays; otherwise idles. */
  active: boolean
  /** Playback position in the clip (s), for timed bursts. */
  clipTime: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetRef = useRef(IDLE)
  const burstRef = useRef({ at: Infinity, time: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let radius = 0
    let letters: Letter[] = []
    let color = "oklch(0 0 0)"
    let frame = 0
    let visible = true
    let last = performance.now()
    let time = 0
    let angle = 0
    const mood = { ...targetRef.current }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 2)
      width = rect.width
      height = rect.height
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const nextRadius = Math.min(width, height) * 0.4
      if (Math.abs(nextRadius - radius) > 4) letters = buildLetters(nextRadius)
      radius = nextRadius
      color = getComputedStyle(canvas!).color
    }

    function step(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      time += dt

      const target = targetRef.current
      const k = 1 - Math.exp(-dt * 3)
      for (const key of Object.keys(mood) as (keyof Mood)[]) {
        mood[key] += (target[key] - mood[key]) * k
      }
      angle += mood.spin * dt

      const { at, time: clipTime } = burstRef.current
      drawGlobe(ctx!, {
        width,
        height,
        radius,
        letters,
        color,
        mood,
        time,
        angle,
        swell: burst(clipTime, at),
      })
      frame = requestAnimationFrame(step)
    }

    function start() {
      cancelAnimationFrame(frame)
      if (!visible) return
      last = performance.now()
      frame = requestAnimationFrame(step)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else cancelAnimationFrame(frame)
    })
    intersectionObserver.observe(canvas)

    // Text colour follows the theme class on <html>.
    const themeObserver = new MutationObserver(() => {
      color = getComputedStyle(canvas).color
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    resize()
    start()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    targetRef.current = active ? (MOODS[emotion] ?? IDLE) : IDLE
  }, [emotion, active])

  useEffect(() => {
    burstRef.current = {
      at: active ? (BURSTS[emotion] ?? Infinity) : Infinity,
      time: clipTime,
    }
  }, [emotion, active, clipTime])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none text-foreground", className)}
    />
  )
}
