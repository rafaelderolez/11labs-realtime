const TEXT = "ELEVENAPI"

export type Letter = {
  x: number
  y: number
  z: number
  char: string
  phase: number
  /** When this letter turns into a swear symbol as `grawlix` rises. */
  curse: number
}

/** Rings of letters at even spacing, so each ring reads "E L E V E N A P I". */
export function buildLetters(radius: number): Letter[] {
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
export const GRAWLIX = "!@#$%&*?"

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

export const HEART: Outline = (() => {
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

export const BALLOON_SIZE = 0.75
/** Raised so the body and string fit where the globe was (× radius). */
export const BALLOON_LIFT = 0.36
/** Distance from the centre to the bottom of the knot (× radius). */
export const BALLOON_KNOT = 1.33

export const BALLOON: Outline = polarOutline((a) => {
  const down = Math.max(0, Math.sin(a))
  const knot = Math.exp(-(((a - Math.PI / 2) / 0.07) ** 2))
  return 0.95 + 0.28 * down ** 3 + 0.1 * knot
})

export function outlineRadius(outline: Outline, x: number, y: number) {
  const a = binOf(x, y)
  const i = Math.floor(a) % OUTLINE_BINS
  const f = a - Math.floor(a)
  return outline[i] * (1 - f) + outline[(i + 1) % OUTLINE_BINS] * f
}
