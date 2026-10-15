/** How quiet the original voice gets while its translation plays over it. */
const DUCKED_GAIN = 0.25
const DUCK_DURATION = 0.4

/** Fetches and decodes one clip. Any context's buffers play in any other. */
export async function fetchAudioBuffer(ctx: BaseAudioContext, src: string) {
  const response = await fetch(src)
  if (!response.ok) throw new Error(`Couldn't load ${src}`)
  return ctx.decodeAudioData(await response.arrayBuffer())
}

/** Holds `gain` at full volume until `at`, then dips it under the translation. */
export function duck(gain: GainNode, at: number) {
  gain.gain.setValueAtTime(1, at)
  gain.gain.linearRampToValueAtTime(DUCKED_GAIN, at + DUCK_DURATION)
}

/** Ramps `gain` to silence from wherever it is now, over `duration` (s). */
export function fadeOut(gain: GainNode, duration: number) {
  const now = gain.context.currentTime
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(0, now + duration)
}
