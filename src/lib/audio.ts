/** How long after the original its translation starts, in both demos (s). */
export const TRANSLATION_DELAY = 1.2

/** How quiet the original voice gets while its translation plays over it. */
const DUCKED_GAIN = 0.15
const DUCK_DURATION = 0.4
/** How long the original sits ducked before the translation comes in (s). */
const DUCK_LEAD = 0.15

/** Fetches and decodes one clip. Any context's buffers play in any other. */
export async function fetchAudioBuffer(ctx: BaseAudioContext, src: string) {
  const response = await fetch(src)
  if (!response.ok) throw new Error(`Couldn't load ${src}`)
  return ctx.decodeAudioData(await response.arrayBuffer())
}

/** Dips `gain` so it's fully ducked just before the translation starts at `at`. */
export function duck(gain: GainNode, at: number) {
  const end = Math.max(at - DUCK_LEAD, 0)
  gain.gain.setValueAtTime(1, Math.max(end - DUCK_DURATION, 0))
  gain.gain.linearRampToValueAtTime(DUCKED_GAIN, end)
}

/** Ramps `gain` to silence from wherever it is now, over `duration` (s). */
export function fadeOut(gain: GainNode, duration: number) {
  const now = gain.context.currentTime
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(0, now + duration)
}
