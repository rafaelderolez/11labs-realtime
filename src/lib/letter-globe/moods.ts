/** How each emotion moves the globe. Values blend as the emotion changes. */
export type Mood = {
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

export const IDLE: Mood = {
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

export const MOODS: Record<string, Mood> = {
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
export const BURSTS: Record<string, number> = {
  // "This is the THIRD time…"
  Angry: 0.64,
}

/** Starts drawing breath this long before the burst, i.e. as the clip starts. */
const INHALE = 0.6
/** Holds the full breath this long before letting go. */
const INHALE_HOLD = 0.1
const INHALE_DEPTH = 0.1
const BURST_RISE = 0.07
const BURST_PEAK = 0.22

/** Extra scale around a burst at `at`; 0 well before and after. */
export function burst(t: number, at: number) {
  const u = t - at
  if (u < -INHALE) return 0
  if (u < 0) {
    // A slow, even draw that settles into a held breath before the word.
    const p = Math.min((u + INHALE) / (INHALE - INHALE_HOLD), 1)
    return -INHALE_DEPTH * (0.5 - 0.5 * Math.cos(Math.PI * p))
  }
  if (u < BURST_RISE) {
    const p = 1 - (1 - u / BURST_RISE) ** 3
    return -INHALE_DEPTH + (BURST_PEAK + INHALE_DEPTH) * p
  }
  const d = u - BURST_RISE
  return BURST_PEAK * Math.exp(-d * 5) * Math.cos(d * 12)
}

/** Lub-dub at rest pace, peaking at 1. */
export function heartbeat(t: number) {
  const p = t % 1.1
  const pulse = (at: number) => Math.exp(-(((p - at) / 0.07) ** 2))
  return pulse(0.1) + 0.6 * pulse(0.34)
}
