import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

const TEXT = "ELEVENAPI"

/** How each emotion moves the globe. Values blend as the emotion changes. */
type Mood = {
  /** Spin around the vertical axis (rad/s). */
  spin: number
  /** Forward tilt: positive looks up, negative hangs its head (rad). */
  tilt: number
  /** Each letter hops off the surface on its own rhythm (× radius). */
  bounce: number
  /** Whole-globe hop with squash and stretch (× radius). */
  hop: number
  /** Sharp outward spikes on random letters (× radius). */
  spike: number
  /** Per-frame letter tremble (px). */
  jitter: number
  /** Slow in-and-out breath (× radius). */
  breathe: number
  /** Lub-dub heartbeat (× radius). */
  heartbeat: number
  /** Melts into a puddle: sinks, spreads and flattens at the bottom (0–1). */
  droop: number
  /** Floats up and down (× radius). */
  float: number
  /**
   * Outlines the globe is pulled into (0–1). They always face the viewer
   * while the letters keep flowing over the sphere underneath.
   */
  heart: number
  balloon: number
  /** Share of letters swapped for sputtering swear symbols (0–1). */
  grawlix: number
  opacity: number
  weight: number
}

/** Where the globe rests while nothing plays. */
const IDLE: Mood = {
  spin: 0.2,
  tilt: 0.25,
  bounce: 0,
  hop: 0,
  spike: 0,
  jitter: 0,
  breathe: 0.01,
  heartbeat: 0,
  droop: 0,
  float: 0,
  heart: 0,
  balloon: 0,
  grawlix: 0,
  opacity: 1,
  weight: 400,
}

const MOODS: Record<string, Mood> = {
  Excited: { ...IDLE, spin: 0.9, bounce: 0.08, hop: 0.05, weight: 500 },
  Hopeful: {
    ...IDLE,
    spin: 0.3,
    tilt: 0.55,
    breathe: 0.025,
    float: 0.03,
    balloon: 1,
  },
  Tired: {
    ...IDLE,
    spin: 0.07,
    tilt: -0.15,
    breathe: 0.012,
    droop: 1,
    opacity: 0.6,
  },
  Angry: {
    ...IDLE,
    spin: 1.3,
    tilt: 0.1,
    spike: 0.14,
    jitter: 1.6,
    grawlix: 0.7,
    weight: 600,
  },
  Loving: { ...IDLE, spin: 0.16, heartbeat: 0.06, heart: 1 },
}

/**
 * One-off swells timed to the clip's loudest moment (s into the clip). The
 * globe inhales just before, then bursts outward on the word.
 */
const BURSTS: Record<string, number> = {
  // "This is the THIRD time…"
  Angry: 0.64,
}

const INHALE = 0.5
const INHALE_DEPTH = 0.1
const BURST_RISE = 0.07
const BURST_PEAK = 0.22

/** Extra scale around a burst at `at`; 0 well before and after. */
function burst(t: number, at: number) {
  const u = t - at
  if (u < -INHALE) return 0
  if (u < 0) {
    // Eases in, so the squeeze tightens right up to the word.
    const p = (u + INHALE) / INHALE
    return -INHALE_DEPTH * p * p
  }
  if (u < BURST_RISE) {
    const p = 1 - (1 - u / BURST_RISE) ** 3
    return -INHALE_DEPTH + (BURST_PEAK + INHALE_DEPTH) * p
  }
  // Damped wobble back to rest.
  const d = u - BURST_RISE
  return BURST_PEAK * Math.exp(-d * 5) * Math.cos(d * 12)
}

type Letter = {
  x: number
  y: number
  z: number
  char: string
  phase: number
  /** When this letter turns into a swear symbol as `grawlix` rises. */
  curse: number
}

/** Rings of letters at even spacing, so each ring reads "E L E V E N A P I". */
function buildLetters(radius: number): Letter[] {
  const spacing = Math.max(12, radius / 11)
  const rings = Math.round((Math.PI * radius) / spacing)
  const letters: Letter[] = []
  for (let i = 1; i < rings; i++) {
    const lat = Math.PI / 2 - (i / rings) * Math.PI
    const count = Math.max(
      1,
      Math.round((2 * Math.PI * radius * Math.cos(lat)) / spacing)
    )
    for (let j = 0; j < count; j++) {
      const lon = (j / count) * Math.PI * 2 + i * 0.37
      letters.push({
        x: Math.cos(lat) * Math.sin(lon),
        y: -Math.sin(lat),
        z: Math.cos(lat) * Math.cos(lon),
        char: TEXT[(j + i * 3) % TEXT.length],
        phase: Math.random() * Math.PI * 2,
        curse: Math.random(),
      })
    }
  }
  return letters
}

const OUTLINE_BINS = 256
const GRAWLIX = "!@#$%&*?"

/**
 * An outline as a polar lookup: distance from the centre (× radius) for each
 * screen angle, so any point on the disc can be pushed out to the outline.
 */
type Outline = Float32Array

function binOf(x: number, y: number) {
  return ((Math.atan2(y, x) + Math.PI) / (Math.PI * 2)) * OUTLINE_BINS
}

/** Outline from a polar function of the screen angle (y points down). */
function polarOutline(radius: (angle: number) => number): Outline {
  const radii = new Float32Array(OUTLINE_BINS)
  for (let i = 0; i < OUTLINE_BINS; i++) {
    radii[i] = radius(((i + 0.5) / OUTLINE_BINS) * Math.PI * 2 - Math.PI)
  }
  return radii
}

const HEART: Outline = (() => {
  const radii = new Float32Array(OUTLINE_BINS)
  for (let i = 0; i < 4096; i++) {
    const t = (i / 4096) * Math.PI * 2
    const x = 16 * Math.sin(t) ** 3
    // Flipped for screen space and centred between the lobes and the tip.
    const y = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t) +
      2.5
    )
    const bin = Math.min(OUTLINE_BINS - 1, Math.floor(binOf(x, y)))
    radii[bin] = Math.max(radii[bin], Math.hypot(x, y) / 15.5)
  }
  return radii
})()

const BALLOON_SIZE = 0.75
/** Raised so the body and string fit where the globe was (× radius). */
const BALLOON_LIFT = 0.36
/** Distance from the centre to the bottom of the knot (× radius). */
const BALLOON_KNOT = 1.33

/** Round on top, tapering to a knot at the bottom. */
const BALLOON: Outline = polarOutline((a) => {
  const down = Math.max(0, Math.sin(a))
  const knot = Math.exp(-(((a - Math.PI / 2) / 0.07) ** 2))
  return 0.95 + 0.28 * down ** 3 + 0.1 * knot
})

/** Outline radius in the direction of (x, y), interpolated between bins. */
function outlineRadius(outline: Outline, x: number, y: number) {
  const a = binOf(x, y)
  const i = Math.floor(a) % OUTLINE_BINS
  const f = a - Math.floor(a)
  return outline[i] * (1 - f) + outline[(i + 1) % OUTLINE_BINS] * f
}

function heartbeat(t: number) {
  const p = t % 1.1
  const pulse = (at: number) => Math.exp(-(((p - at) / 0.07) ** 2))
  return pulse(0.1) + 0.6 * pulse(0.34)
}

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
    let color = "#000"
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

    function draw() {
      const R = radius
      const fontSize = Math.max(9, Math.min(12, R / 14))
      const hop = mood.hop * R * Math.abs(Math.sin(time * 3.4))
      // Squashes as it lands, stretches as it leaves the ground.
      const squash = mood.hop * 1.6 * Math.cos(time * 6.8)
      const swell = burst(burstRef.current.time, burstRef.current.at)
      const scale =
        1 +
        mood.breathe * Math.sin(time * 1.3) +
        mood.heartbeat * heartbeat(time) +
        swell
      // Shakes harder for a moment as it bursts.
      const jitter = mood.jitter * (1 + Math.max(0, swell) * 15)
      const cx = width / 2 + (Math.random() - 0.5) * jitter
      const cy =
        height / 2 -
        hop +
        mood.float * R * Math.sin(time * 0.9) -
        mood.balloon * R * BALLOON_LIFT
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const cosT = Math.cos(mood.tilt)
      const sinT = Math.sin(mood.tilt)

      ctx!.clearRect(0, 0, width, height)
      ctx!.fillStyle = color
      ctx!.textAlign = "center"
      ctx!.textBaseline = "middle"
      ctx!.font = `${Math.round(mood.weight / 50) * 50} ${fontSize}px "Inter Variable", sans-serif`

      for (const l of letters) {
        // Spin around Y, then tilt around X.
        const x1 = l.x * cosA + l.z * sinA
        const z1 = -l.x * sinA + l.z * cosA
        const y = l.y * cosT - z1 * sinT
        const z = l.y * sinT + z1 * cosT
        if (z < -0.35) continue

        let r = scale
        r += mood.bounce * Math.abs(Math.sin(time * 5 + l.phase * 3))
        r += mood.spike * Math.max(0, Math.sin(time * 7 + l.phase * 5)) ** 12

        let px = x1 * r * (1 - squash * 0.5)
        let py = y * r * (1 + squash)
        let k = 1
        if (mood.heart > 0.001)
          k += mood.heart * (outlineRadius(HEART, px, py) - 1)
        if (mood.balloon > 0.001) {
          k += mood.balloon * (outlineRadius(BALLOON, px, py) - 1)
        }
        // Shrinks to leave room below for the string.
        k *= 1 - mood.balloon * (1 - BALLOON_SIZE)
        px *= k
        py *= k
        if (mood.droop > 0.001) {
          // Squashed toward the floor, spreading wider the lower it sits,
          // with a slow wobble across the top.
          const d = mood.droop
          py = 1 - (1 - py) * (1 - d * 0.62)
          px *= 1 + d * 0.65 * ((py + 1) / 2) ** 2
          py += d * 0.03 * Math.sin(px * 4 + time * 1.2) * (1 - py)
        }
        const sx = cx + px * R + (Math.random() - 0.5) * jitter
        const sy = cy + py * R + (Math.random() - 0.5) * jitter

        const depth = (z + 1) / 2
        ctx!.globalAlpha = mood.opacity * (0.08 + 0.82 * depth ** 1.6)
        // Swaps a few times a second so the cursing sputters. Every letter
        // curses at the peak of a burst.
        const cursing = l.curse < mood.grawlix + Math.max(0, swell) * 4
        const char = cursing
          ? GRAWLIX[Math.floor(time * 7 + l.phase * 9) % GRAWLIX.length]
          : l.char
        ctx!.fillText(char, sx, sy)
      }

      if (mood.balloon > 0.01) {
        // String hangs from the knot and swings at its loose end.
        const x0 = cx
        const y0 = cy + R * scale * BALLOON_KNOT * BALLOON_SIZE
        const length = R * 0.55
        const swing = Math.sin(time * 1.6) * R * 0.08
        ctx!.globalAlpha = mood.balloon * mood.opacity * 0.7
        ctx!.strokeStyle = color
        ctx!.lineWidth = 1.25
        ctx!.lineCap = "round"
        ctx!.beginPath()
        ctx!.moveTo(x0, y0)
        ctx!.bezierCurveTo(
          x0 - swing * 0.6,
          y0 + length * 0.35,
          x0 + swing,
          y0 + length * 0.65,
          x0 + swing * 0.4,
          y0 + length
        )
        ctx!.stroke()
      }
      ctx!.globalAlpha = 1
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

      draw()
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
