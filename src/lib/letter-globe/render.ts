import { heartbeat, type Mood } from "@/lib/letter-globe/moods"
import {
  BALLOON,
  BALLOON_KNOT,
  BALLOON_LIFT,
  BALLOON_SIZE,
  GRAWLIX,
  HEART,
  outlineRadius,
  type Letter,
} from "@/lib/letter-globe/shapes"

export type GlobeFrame = {
  width: number
  height: number
  /** Globe radius (px). */
  radius: number
  letters: Letter[]
  color: string
  /** The current blend of moods. */
  mood: Mood
  /** Seconds since the globe started animating. */
  time: number
  /** Spin around the vertical axis so far (rad). */
  angle: number
  /** Extra scale from a burst, from `burst()`. */
  swell: number
}

/** Paints one frame of the globe; holds no state between frames. */
export function drawGlobe(
  ctx: CanvasRenderingContext2D,
  {
    width,
    height,
    radius: R,
    letters,
    color,
    mood,
    time,
    angle,
    swell,
  }: GlobeFrame
) {
  const fontSize = Math.max(9, Math.min(12, R / 14))
  const hop = mood.hop * R * Math.abs(Math.sin(time * 3.4))
  // Squashes as it lands, stretches as it leaves the ground.
  const squash = mood.hop * 1.6 * Math.cos(time * 6.8)
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

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = color
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${Math.round(mood.weight / 50) * 50} ${fontSize}px "Inter Variable", sans-serif`

  for (const l of letters) {
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
    if (mood.heart > 0.001) k += mood.heart * (outlineRadius(HEART, px, py) - 1)
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
    ctx.globalAlpha = mood.opacity * (0.08 + 0.82 * depth ** 1.6)
    // Swaps a few times a second so the cursing sputters. Every letter
    // curses at the peak of a burst.
    const cursing = l.curse < mood.grawlix + Math.max(0, swell) * 4
    const char = cursing
      ? GRAWLIX[Math.floor(time * 7 + l.phase * 9) % GRAWLIX.length]
      : l.char
    ctx.fillText(char, sx, sy)
  }

  if (mood.balloon > 0.01) {
    const x0 = cx
    const y0 = cy + R * scale * BALLOON_KNOT * BALLOON_SIZE
    const length = R * 0.55
    const swing = Math.sin(time * 1.6) * R * 0.08
    ctx.globalAlpha = mood.balloon * mood.opacity * 0.7
    ctx.strokeStyle = color
    ctx.lineWidth = 1.25
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.bezierCurveTo(
      x0 - swing * 0.6,
      y0 + length * 0.35,
      x0 + swing,
      y0 + length * 0.65,
      x0 + swing * 0.4,
      y0 + length
    )
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
