import { Suspense, lazy, memo, useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react"

import { LanguageFlag } from "@/components/ui/language-picker"
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
function useCall(inView: boolean, reduceMotion: boolean | null) {
  const [time, setTime] = useState(0)
  const [sound, setSound] = useState(false)
  // Reduced motion holds the visuals still, so the clock only runs to keep
  // the audio looping.
  const running = inView && (!reduceMotion || sound)
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

export function TranslatedCallTurns({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduceMotion = useReducedMotion()
  const call = useCall(inView, reduceMotion)
  // Light sweeps round Listen until it's been pressed once.
  const [pressed, setPressed] = useState(false)
  // Reduced motion shows the finished call.
  const time = reduceMotion ? SCHEDULE.duration - RESTART : call.time

  // How many words of each line are out, or -1 before it starts. The turns
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
        "relative h-[620px] overflow-hidden rounded-2xl bg-surface md:h-[560px]",
        className
      )}
    >
      <Orb active={speaking} voice={voice} paused={!!reduceMotion} />

      <Turns spoken={spoken} />

      {/* Only offered once every line has loaded, so Listen always plays. */}
      {call.ready ? (
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
              className="border-sweep absolute -inset-px rounded-full motion-reduce:hidden"
            />
          )}
          {call.sound ? (
            <VolumeX className="size-4" strokeWidth={1.75} />
          ) : (
            <Volume2 className="size-4" strokeWidth={1.75} />
          )}
          {call.sound ? "Mute" : "Listen"}
        </motion.button>
      ) : null}

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

/**
 * The call as one thread, a card per turn on the speaker's side. Being a
 * single column, it narrows to mobile without reflowing between sides.
 */
const Turns = memo(
  function Turns({ spoken }: { spoken: number[] }) {
    return (
      <div
        aria-hidden
        className="relative z-10 flex h-full flex-col justify-end gap-2.5 [mask-image:linear-gradient(to_bottom,transparent,black_35%)] px-3 pb-4 md:gap-3 md:px-12 md:pb-10"
      >
        <AnimatePresence initial={false}>
          {SCHEDULE.turns.map((turn, i) =>
            spoken[i * 2] < 0 ? null : (
              <TurnCard
                key={turn.said.src}
                turn={turn}
                said={spoken[i * 2]}
                heard={spoken[i * 2 + 1]}
              />
            )
          )}
        </AnimatePresence>
      </div>
    )
  },
  (prev, next) => prev.spoken.every((count, i) => count === next.spoken[i])
)

/** Resizing as lines wrap, matched to the card in the live translation demo. */
const RESIZE = { type: "spring", duration: 0.45, bounce: 0 } as const
/** A sent message's pop: quick, with a touch of overshoot. */
const POP = { type: "spring", duration: 0.5, bounce: 0.2 } as const
const EASE_OUT = [0.23, 1, 0.32, 1] as const

const text = (words: Word[]) => words.map(([word]) => word).join(" ")

/** The first `count` words, each fading in as it arrives. */
function Words({ words, count }: { words: Word[]; count: number }) {
  if (count <= 0) return "​"
  return words.slice(0, count).map(([word], i) => (
    <span
      key={i}
      className="animate-in duration-200 ease-out-strong fade-in motion-reduce:animate-none"
    >
      {i > 0 ? " " : null}
      {word}
    </span>
  ))
}

/**
 * One turn: the speaker's own words as a single truncated line, and the
 * translation, which is the feature, set large beneath it. Both full texts
 * size the card up front, so only its height moves as the translation lands.
 */
function TurnCard({
  turn: { said: saidLine, heard: heardLine },
  said,
  heard,
}: {
  turn: ScheduledTurn
  said: number
  heard: number
}) {
  const by = saidLine.side
  const start = by === "left"

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
      // Inline radius lets motion correct it while the card scales.
      style={{ borderRadius: 16, originX: start ? 0 : 1, originY: 1 }}
      className={cn(
        // Clipped, so the translation is uncovered as the card grows into it.
        "flex max-w-[min(340px,85%)] flex-col gap-1.5 overflow-hidden bg-pill px-4 pt-3 pb-3.5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)]",
        start ? "self-start" : "self-end"
      )}
    >
      <motion.div
        layout="position"
        transition={RESIZE}
        className="flex min-w-0 items-center gap-1.5"
        lang={SPEAKERS[by].lang}
      >
        <LanguageFlag code={SPEAKERS[by].lang} className="size-3.5" />
        <div className="grid min-w-0">
          <p className="invisible h-0 truncate">{text(saidLine.words)}</p>
          <p className="truncate text-label-xs text-foreground/45">
            <Words words={saidLine.words} count={said} />
          </p>
        </div>
      </motion.div>

      <motion.div
        layout="position"
        transition={RESIZE}
        className="grid text-body text-foreground"
        lang={SPEAKERS[other(by)].lang}
      >
        <p className="invisible h-0 overflow-hidden">{text(heardLine.words)}</p>
        {heard < 0 ? null : (
          <p>
            <Words words={heardLine.words} count={heard} />
          </p>
        )}
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

function Orb({
  active,
  voice,
  paused,
}: {
  active: boolean
  voice: Side
  paused: boolean
}) {
  return (
    <div
      aria-hidden
      // Above the thread on mobile, behind it in the middle from md up.
      className="pointer-events-none absolute top-[68px] left-1/2 size-[120px] -translate-x-1/2 md:top-1/2 md:size-[240px] md:-translate-y-1/2"
    >
      <Suspense>
        <VoiceOrb
          agentState={active ? "talking" : null}
          colors={ORB_COLORS[voice]}
          seed={11}
          paused={paused}
        />
      </Suspense>
    </div>
  )
}
