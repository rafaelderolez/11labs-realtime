import { CALL, clipPath, type Side } from "@/content/call-script"
import TIMINGS from "@/content/call-timings.json"
import { TRANSLATION_DELAY } from "@/lib/audio"
import { timingFor, type Word } from "@/lib/timings"

/** Silence between turns (s). */
const GAP = 1.1
/** Silence after the last turn, before the call loops (s). */
export const RESTART = 3

export type Line = {
  src: string
  words: Word[]
  start: number
  duration: number
  side: Side
  /** Whether it's the speaker's own words, or the translation they caused. */
  own: boolean
}

export type ScheduledTurn = { said: Line; heard: Line }

export const other = (side: Side): Side => (side === "left" ? "right" : "left")

// Lay the whole call out on one clock: the translation starts
// TRANSLATION_DELAY behind the speaker, and the reply waits until both have
// finished.
export const SCHEDULE = (() => {
  let t = 0.6
  const turns = CALL.map((turn): ScheduledTurn => {
    const line = (part: "said" | "heard", start: number): Line => {
      const src = clipPath(turn, part)
      const timing = timingFor(TIMINGS, src)
      return {
        src,
        words: timing.words,
        start,
        duration: timing.duration,
        side: part === "said" ? turn.by : other(turn.by),
        own: part === "said",
      }
    }
    const said = line("said", t)
    const heard = line("heard", t + TRANSLATION_DELAY)
    t = Math.max(said.start + said.duration, heard.start + heard.duration) + GAP
    return { said, heard }
  })
  return { turns, duration: t + RESTART }
})()

/** Every line in call order: each turn's own words, then its translation. */
export const LINES = SCHEDULE.turns.flatMap((turn) => [turn.said, turn.heard])
