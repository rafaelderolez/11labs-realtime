import { Volume2, VolumeX } from "lucide-react"
import { AnimatePresence, m, useInView, useReducedMotion } from "motion/react"
import { Suspense, lazy, memo, useMemo, useRef, use, useState } from "react"

import { LanguageFlag } from "@/components/ui/language-picker"
import { CALL, SPEAKERS, type Side } from "@/content/call-script"
import { loadCallBuffers, useCall, type CallBuffers } from "@/hooks/use-call"
import { usePageIdle } from "@/hooks/use-page-idle"
import {
  LINES,
  RESTART,
  SCHEDULE,
  other,
  type ScheduledTurn,
} from "@/lib/call-schedule"
import { lineText, type Word } from "@/lib/timings"
import { cn } from "@/lib/utils"

/**
 * How early a turn's card mounts, so the thread has nearly finished moving
 * up to make room by the time the card pops in with the first word (s).
 */
const ROOM = 0.3
/**
 * How early the orb starts easing into the next speaker's colours, so it has
 * mostly arrived by the time they start talking (s).
 */
const ORB_LEAD = 0.4

export function TranslatedCall({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduceMotion = useReducedMotion()
  const call = useCall(inView, reduceMotion)
  const idle = usePageIdle()
  // Reduced motion shows the finished call.
  const time = reduceMotion ? SCHEDULE.duration - RESTART : call.time

  // How many words of each line are out, or -1 before it starts. A turn's
  // card mounts ROOM early, empty, to push the thread up. The turns only
  // re-render when this changes, not on every frame of the clock.
  const spoken = useMemo(
    () =>
      LINES.map((line) =>
        time < line.start - (line.own ? ROOM : 0)
          ? -1
          : line.words.filter(([, at]) => time >= line.start + at).length
      ),
    [time]
  )

  const speaking = LINES.some(
    (line) => time >= line.start && time < line.start + line.duration
  )
  // Who spoke last. It holds through their translation and the gap after, so
  // the orb only changes colour as the next speaker starts.
  const voice =
    LINES.findLast((line) => line.own && time >= line.start - ORB_LEAD)?.side ??
    SCHEDULE.turns[0].said.side

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-155 overflow-hidden rounded-2xl bg-surface md:h-140",
        className
      )}
    >
      {idle && <Orb active={speaking} voice={voice} paused={!!reduceMotion} />}

      <Turns spoken={spoken} />

      {/* Only offered once every line has loaded, so Listen always plays. */}
      {idle && (
        <Suspense>
          <ListenButton
            sound={call.sound}
            onToggle={(buffers) => {
              // Listen sits at the card's top edge, so bring the whole call
              // into view rather than leaving it hanging off a phone screen.
              if (!call.sound && window.matchMedia("(width < 48rem)").matches) {
                ref.current?.scrollIntoView({
                  behavior: reduceMotion ? "auto" : "smooth",
                  block: "center",
                })
              }
              call.toggleSound(buffers)
            }}
          />
        </Suspense>
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

function ListenButton({
  sound,
  onToggle,
}: {
  sound: boolean
  onToggle: (buffers: CallBuffers) => void
}) {
  const buffers = use(loadCallBuffers())
  // Light sweeps round Listen until it's been pressed once.
  const [pressed, setPressed] = useState(false)
  if (!buffers) return null

  return (
    <m.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      onClick={() => {
        setPressed(true)
        onToggle(buffers)
      }}
      aria-pressed={sound}
      className="absolute top-4 left-1/2 z-20 flex h-9 -translate-x-1/2 items-center gap-2 rounded-full bg-pill px-3.5 text-label-sm text-foreground shadow-pill-float transition-colors hover:bg-pill-hover"
    >
      {pressed ? null : (
        <span
          aria-hidden
          // Straddles the edge, so it reads against the page as well.
          className="border-sweep absolute -inset-px rounded-full motion-reduce:hidden"
        />
      )}
      {sound ? (
        <VolumeX className="size-4" strokeWidth={1.75} />
      ) : (
        <Volume2 className="size-4" strokeWidth={1.75} />
      )}
      {sound ? "Mute" : "Listen"}
    </m.button>
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
        className="relative z-10 flex h-full flex-col justify-end gap-2.5 mask-t-from-65% px-3 pb-4 md:gap-3 md:px-12 md:pb-10"
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

/** The first `count` words, each fading in as it arrives. */
function Words({ words, count }: { words: Word[]; count: number }) {
  if (count <= 0) return "​"
  return words.slice(0, count).map(([word, at], i) => (
    <span
      key={at}
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
    <m.div
      layout
      // Pops out of the corner it's anchored to, like a sent message.
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
      // Held back until the cards above have moved out of its way.
      transition={{
        scale: { ...POP, delay: ROOM },
        opacity: { duration: 0.2, ease: EASE_OUT, delay: ROOM },
        layout: RESIZE,
      }}
      // Inline radius lets motion correct it while the card scales.
      style={{ borderRadius: 16, originX: start ? 0 : 1, originY: 1 }}
      className={cn(
        // Clipped, so the translation is uncovered as the card grows into it.
        "flex max-w-[min(340px,85%)] flex-col gap-1.5 overflow-hidden bg-pill px-4 pt-3 pb-3.5 shadow-bubble",
        start ? "self-start" : "self-end"
      )}
    >
      <m.div
        layout="position"
        transition={RESIZE}
        className="flex min-w-0 items-center gap-1.5"
        lang={SPEAKERS[by].lang}
      >
        <LanguageFlag code={SPEAKERS[by].lang} className="size-3.5" />
        <div className="grid min-w-0">
          <p className="invisible h-0 truncate">{lineText(saidLine.words)}</p>
          <p className="truncate text-label-xs text-tertiary-foreground">
            <Words words={saidLine.words} count={said} />
          </p>
        </div>
      </m.div>

      <m.div
        layout="position"
        transition={RESIZE}
        className="grid text-body text-foreground"
        lang={SPEAKERS[other(by)].lang}
      >
        <p className="invisible h-0 overflow-hidden">
          {lineText(heardLine.words)}
        </p>
        {heard < 0 ? null : (
          <p>
            <Words words={heardLine.words} count={heard} />
          </p>
        )}
      </m.div>
    </m.div>
  )
}

// three.js is heavy, so the orb loads on its own once the page is idle.
const VoiceOrb = lazy(() =>
  import("@/components/ui/orb").then((module) => ({ default: module.Orb }))
)

/** The orb takes on the colours of whoever is speaking, in either language.
 *  Hex, not OKLCH: they feed THREE.Color, which cannot parse oklch(). */
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
      className="pointer-events-none absolute top-17 left-1/2 size-30 -translate-x-1/2 md:top-1/2 md:size-60 md:-translate-y-1/2"
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
