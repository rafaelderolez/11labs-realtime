import { Suspense, lazy, memo, useEffect, useRef, useState } from "react"
import { Sparkles, Volume2, VolumeX } from "lucide-react"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react"

import { CALL, SPEAKERS, clipPath, type Side } from "@/lib/call-script"
import TIMINGS from "@/lib/call-timings.json"
import { cn } from "@/lib/utils"

/** How far the translation trails the speaker (s). */
const LAG = 0.7
/** Silence between turns, and before the call restarts (s). */
const GAP = 1.1
const RESTART = 3
/** Volume the speaker drops to once their translation comes in. */
const DUCKED_GAIN = 0.25
const DUCK_DURATION = 0.4
/** Each voice sits on its speaker's side of the stereo field. */
const PAN = 0.6

type Word = [text: string, start: number]

type Line = {
  src: string
  words: Word[]
  start: number
  duration: number
  /** The side of the call this line is shown and heard on. */
  side: Side
  /** Whether it's the speaker's own words, or the translation they caused. */
  own: boolean
}

type ScheduledTurn = { said: Line; heard: Line }

const other = (side: Side): Side => (side === "left" ? "right" : "left")

// Lay the whole call out on one clock: the translation starts LAG behind the
// speaker, and the reply waits until both have finished.
const SCHEDULE = (() => {
  let t = 0.6
  const turns = CALL.map((turn): ScheduledTurn => {
    const line = (part: "said" | "heard", start: number): Line => {
      const src = clipPath(turn, part)
      const timing = TIMINGS[src as keyof typeof TIMINGS]
      return {
        src,
        words: timing.words as Word[],
        start,
        duration: timing.duration,
        side: part === "said" ? turn.by : other(turn.by),
        own: part === "said",
      }
    }
    const said = line("said", t)
    const heard = line("heard", t + LAG)
    t = Math.max(said.start + said.duration, heard.start + heard.duration) + GAP
    return { said, heard }
  })
  return { turns, duration: t + RESTART }
})()

const LINES = SCHEDULE.turns.flatMap((turn) => [turn.said, turn.heard])

type Audio = {
  ctx: AudioContext
  buffers: Map<string, AudioBuffer>
  output: GainNode
  /** Context time at which the current loop of the call began. */
  origin: number
}

/** Queues every line still to come in this loop, from call time `from`. */
function schedule(audio: Audio, from: number) {
  const { ctx, buffers, output, origin } = audio
  for (const { said, heard } of SCHEDULE.turns) {
    // Sound can come on mid-call, before this context's clock began, which
    // puts the loop's origin in the negative. Automation rejects those times.
    const heardAt = Math.max(origin + heard.start, 0)
    for (const line of [said, heard]) {
      const offset = Math.max(from - line.start, 0)
      if (offset >= line.duration) continue

      const gain = ctx.createGain()
      // The speaker ducks under their own translation.
      if (line === said) {
        gain.gain.setValueAtTime(1, heardAt)
        gain.gain.linearRampToValueAtTime(DUCKED_GAIN, heardAt + DUCK_DURATION)
      }
      const panner = ctx.createStereoPanner()
      panner.pan.value = line.side === "left" ? -PAN : PAN
      gain.connect(panner).connect(output)

      const node = ctx.createBufferSource()
      node.buffer = buffers.get(line.src)!
      node.connect(gain)
      node.start(Math.max(origin + line.start, ctx.currentTime), offset)
    }
  }
}

/** Fetches and decodes every line up front, so Listen can start at once. */
async function loadBuffers() {
  // Decoding needs no sound, so an offline context does it without tripping
  // the autoplay policy. Its buffers play in any context.
  const decoder = new OfflineAudioContext(1, 1, 44100)
  return new Map(
    await Promise.all(
      LINES.map(async ({ src }) => {
        const response = await fetch(src)
        if (!response.ok) throw new Error(`Couldn't load ${src}`)
        const data = await response.arrayBuffer()
        return [src, await decoder.decodeAudioData(data)] as const
      })
    )
  )
}

/**
 * A looping clock for the call. Silent, it runs on frame time; with sound on,
 * it follows the audio context so the words stay locked to the voices.
 */
function useCall(running: boolean) {
  const [time, setTime] = useState(0)
  const [sound, setSound] = useState(false)
  const [buffers, setBuffers] = useState<Audio["buffers"] | null>(null)
  const timeRef = useRef(0)
  const audioRef = useRef<Audio | null>(null)

  useEffect(() => {
    let cancelled = false
    // If loading fails, the call just plays on without sound.
    loadBuffers().then(
      (loaded) => !cancelled && setBuffers(loaded),
      () => {}
    )
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!running) {
      void audio?.ctx.suspend()
      return
    }
    void audio?.ctx.resume()

    let frame = 0
    let last: number | null = null
    const tick = (now: number) => {
      const audio = audioRef.current
      let t: number
      if (audio) {
        t = audio.ctx.currentTime - audio.origin
        if (t >= SCHEDULE.duration) {
          audio.origin += SCHEDULE.duration
          t -= SCHEDULE.duration
          schedule(audio, 0)
        }
      } else {
        const delta = last === null ? 0 : (now - last) / 1000
        t = (timeRef.current + delta) % SCHEDULE.duration
      }
      last = now
      timeRef.current = t
      setTime(t)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])

  useEffect(() => () => void audioRef.current?.ctx.close(), [])

  function toggleSound() {
    const current = audioRef.current
    if (current) {
      audioRef.current = null
      setSound(false)
      const now = current.ctx.currentTime
      current.output.gain.setValueAtTime(current.output.gain.value, now)
      current.output.gain.linearRampToValueAtTime(0, now + 0.2)
      setTimeout(() => void current.ctx.close(), 300)
      return
    }

    if (!buffers) return
    const ctx = new AudioContext()
    const output = ctx.createGain()
    output.connect(ctx.destination)
    // Pick up wherever the visuals are, mid-line if need be.
    const audio = {
      ctx,
      buffers,
      output,
      origin: ctx.currentTime - timeRef.current,
    }
    schedule(audio, timeRef.current)
    audioRef.current = audio
    setSound(true)
  }

  return { time, sound, ready: buffers !== null, toggleSound }
}

export function TranslatedCall({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduceMotion = useReducedMotion()
  const call = useCall(inView && !reduceMotion)
  // Light sweeps round Listen until it's been pressed once.
  const [pressed, setPressed] = useState(false)
  // Reduced motion shows the finished call.
  const time = reduceMotion ? SCHEDULE.duration - RESTART : call.time

  // How many words of each line are out, or -1 before it starts. The columns
  // only re-render when this changes, not on every frame of the clock.
  const spoken = LINES.map((line) =>
    time < line.start
      ? -1
      : line.words.filter(([, at]) => time >= line.start + at).length
  )

  const speaking = LINES.some(
    (line) => time >= line.start && time < line.start + line.duration
  )
  // Whose voice the latest translation is in. It holds between turns, so the
  // orb only changes colour when the next translation starts.
  const voice = other(
    LINES.findLast((line) => !line.own && time >= line.start)?.side ??
      LINES.find((line) => !line.own)!.side
  )

  return (
    <div
      ref={ref}
      className={cn(
        "relative grid h-[560px] grid-cols-2 items-center overflow-hidden rounded-2xl bg-surface",
        className
      )}
    >
      <Orb active={speaking} voice={voice} />

      {(["left", "right"] as const).map((side) => (
        <Column key={side} side={side} spoken={spoken} />
      ))}

      {/* Only offered once every line has loaded, so Listen always plays. */}
      {reduceMotion || !call.ready ? null : (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          onClick={() => {
            setPressed(true)
            call.toggleSound()
          }}
          aria-pressed={call.sound}
          className="absolute top-4 left-1/2 z-20 flex h-9 -translate-x-1/2 items-center gap-2 rounded-full bg-pill px-3.5 text-label-sm text-foreground shadow-[0_0_0_0.5px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] transition-colors outline-none hover:bg-pill-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {pressed ? null : (
            <span
              aria-hidden
              // Straddles the edge, so it reads against the page as well.
              className="border-sweep absolute -inset-px rounded-full"
            />
          )}
          {call.sound ? (
            <VolumeX className="size-4" strokeWidth={1.75} />
          ) : (
            <Volume2 className="size-4" strokeWidth={1.75} />
          )}
          {call.sound ? "Mute" : "Listen"}
        </motion.button>
      )}

      <ol className="sr-only">
        {CALL.map((turn) => (
          <li key={turn.id}>
            {SPEAKERS[turn.by].name}:{" "}
            <span lang={SPEAKERS[turn.by].lang}>{turn.said}</span> (
            <span lang={SPEAKERS[other(turn.by)].lang}>{turn.heard}</span>)
          </li>
        ))}
      </ol>
    </div>
  )
}

/** One person's side of the call, entirely in their own language. */
const Column = memo(
  function Column({ side, spoken }: { side: Side; spoken: number[] }) {
    const speaker = SPEAKERS[side]

    return (
      <div
        aria-hidden
        className={cn(
          "relative z-10 flex h-full flex-col justify-end gap-3 [mask-image:linear-gradient(to_bottom,transparent,black_35%)] px-6 pb-10 lg:px-12",
          side === "left" ? "items-start" : "items-end"
        )}
      >
        <AnimatePresence initial={false}>
          {LINES.map((line, i) =>
            line.side !== side || spoken[i] < 0 ? null : (
              <Bubble
                key={line.src}
                line={line}
                spoken={spoken[i]}
                lang={speaker.lang}
                // Own lines hug the outer edge, heard lines lean in toward the orb.
                edge={line.own === (side === "left") ? "start" : "end"}
              />
            )
          )}
        </AnimatePresence>
      </div>
    )
  },
  (prev, next) =>
    prev.side === next.side &&
    prev.spoken.every((count, i) => count === next.spoken[i])
)

/** Resizing as lines wrap, matched to the card in the live translation demo. */
const RESIZE = { type: "spring", duration: 0.45, bounce: 0 } as const
/** A sent message's pop: quick, with a touch of overshoot. */
const POP = { type: "spring", duration: 0.5, bounce: 0.2 } as const
const EASE_OUT = [0.23, 1, 0.32, 1] as const

/**
 * A message that grows a line at a time as the words come in. The full text
 * sets its width up front, so the words never reflow and only the height
 * moves.
 */
function Bubble({
  line: { words, own, side },
  spoken,
  lang,
  edge,
}: {
  line: Line
  spoken: number
  lang: string
  edge: "start" | "end"
}) {
  return (
    <motion.div
      layout
      // Pops out of the corner it's anchored to, like a sent message.
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
      transition={{
        scale: POP,
        opacity: { duration: 0.2, ease: EASE_OUT },
        layout: RESIZE,
      }}
      // Inline radius lets motion correct it while the bubble scales.
      style={{
        borderRadius: 16,
        originX: edge === "start" ? 0 : 1,
        originY: 1,
      }}
      lang={lang}
      className={cn(
        // Clipped, so a new line is uncovered as the bubble grows into it.
        "max-w-[min(300px,100%)] overflow-hidden px-4 py-3 text-body-sm",
        // The translation is the feature, so it takes the solid card; the
        // speaker's own words recede behind it.
        own
          ? "bg-bubble-quiet text-foreground/45 backdrop-blur-md"
          : "bg-pill text-foreground shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)]",
        edge === "start" ? "self-start" : "self-end"
      )}
    >
      <motion.div layout="position" transition={RESIZE} className="flex gap-2">
        {own ? null : (
          <Sparkles
            className="mt-[3px] size-3.5 shrink-0"
            style={{ color: VOICE_ACCENT[other(side)] }}
            strokeWidth={2}
          />
        )}
        <div className="grid">
          <p className="invisible h-0 overflow-hidden">
            {words.map(([word]) => word).join(" ")}
          </p>
          <p>
            {spoken === 0
              ? "\u200b"
              : words.slice(0, spoken).map(([word], i) => (
                  <span
                    key={i}
                    className="animate-in duration-200 ease-out-strong fade-in motion-reduce:animate-none"
                  >
                    {i > 0 ? " " : null}
                    {word}
                  </span>
                ))}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// three.js is heavy, so the orb loads on its own after the page.
const VoiceOrb = lazy(() =>
  import("@/components/ui/orb").then((module) => ({ default: module.Orb }))
)

/** The orb takes on the colours of the voice the translation is spoken in. */
const ORB_COLORS: Record<Side, [string, string]> = {
  left: ["#F9C9DA", "#E59BB8"],
  right: ["#CADCFC", "#A0B9D1"],
}

/** A deeper shade of each voice's orb colour, for marking its translations. */
const VOICE_ACCENT: Record<Side, string> = {
  left: "#D47A9C",
  right: "#6D8FD6",
}

function Orb({ active, voice }: { active: boolean; voice: Side }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 size-[240px] -translate-x-1/2 -translate-y-1/2"
    >
      <Suspense>
        <VoiceOrb
          agentState={active ? "talking" : null}
          colors={ORB_COLORS[voice]}
          seed={11}
        />
      </Suspense>
    </div>
  )
}
