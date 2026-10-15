import { Pause, Play } from "lucide-react"
import { m, useReducedMotion } from "motion/react"

import { LetterGlobe } from "@/components/demos/letter-globe"
import {
  TRANSLATION_DELAY,
  useLiveTranslation,
} from "@/hooks/use-live-translation"
import { CLIPS, type Line } from "@/lib/emotion-clips"
import { cn } from "@/lib/utils"

const CARD_RESIZE = { type: "spring", duration: 0.45, bounce: 0 } as const

/** Language codes beside their lines; every clip's lines share one cell. */
const TRANSCRIPT =
  "col-start-1 row-start-1 grid grid-cols-[auto_1fr] content-start items-baseline gap-x-2 gap-y-2 md:gap-y-0"

export function LiveTranslationDemo({
  onClipChange,
  className,
}: {
  /** Called when a different clip starts, so the settings can follow it. */
  onClipChange?: (index: number) => void
  className?: string
}) {
  const { clip, clipIndex, status, elapsed, duration, toggle, play } =
    useLiveTranslation(onClipChange)
  const showAll = status === "idle" || status === "ended"
  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0
  const reduceMotion = useReducedMotion()

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-hairline bg-surface px-content pt-2 pb-6 md:gap-10 md:py-10",
        className
      )}
    >
      {/* Phones stack the globe above the transcript so it stays in view;
          wider screens float the transcript over it. */}
      <div className="relative flex w-full flex-1 flex-col items-center gap-4 md:flex-row md:justify-center md:gap-0">
        {!reduceMotion && (
          <LetterGlobe
            emotion={clip.emotion}
            active={status === "playing"}
            clipTime={elapsed}
            className="h-55 w-full md:absolute md:top-1/2 md:left-1/2 md:h-100 md:w-150 md:-translate-1/2"
          />
        )}
        <m.div
          layout
          transition={CARD_RESIZE}
          // Inline radius lets motion correct it while the card scales.
          style={{ borderRadius: 16 }}
          className="relative flex w-full max-w-180 items-start gap-4 px-3 md:w-fit md:items-center md:gap-3 md:border md:border-hairline md:bg-surface-raised md:p-6 md:shadow-card"
        >
          <m.div
            layout="position"
            transition={CARD_RESIZE}
            className="grid w-full min-w-0 flex-1"
          >
            {/* Phones reserve the tallest clip's lines, so the card keeps
                one height across emotions. */}
            {CLIPS.map(({ emotion, source, translation }) => (
              <div
                key={emotion}
                aria-hidden
                className={cn(TRANSCRIPT, "invisible md:hidden")}
              >
                <TranscriptLine line={source} offset={0} elapsed={0} showAll />
                <TranscriptLine
                  line={translation}
                  offset={0}
                  elapsed={0}
                  showAll
                />
              </div>
            ))}
            <div className={TRANSCRIPT}>
              <TranscriptLine
                key={`${clipIndex}-source`}
                line={clip.source}
                offset={0}
                elapsed={elapsed}
                showAll={showAll}
                className="text-faint-foreground"
              />
              <TranscriptLine
                key={`${clipIndex}-translation`}
                line={clip.translation}
                offset={TRANSLATION_DELAY}
                elapsed={elapsed}
                showAll={showAll}
              />
            </div>
          </m.div>
          <m.div layout="position" transition={CARD_RESIZE}>
            <PlayButton
              playing={status === "playing"}
              progress={progress}
              onClick={toggle}
            />
          </m.div>
        </m.div>
      </div>

      {/* Bleeds to the card edges so pills scroll under the faded edges. The
          vertical padding stops overflow from clipping the pill shadows. */}
      <div className="relative -mx-content -my-2 no-scrollbar self-stretch overflow-x-auto mask-x-from-[calc(100%-var(--spacing-content))] px-content py-2 md:mask-none">
        <div
          className="mx-auto flex w-max items-center gap-1"
          role="group"
          aria-label="Emotion"
        >
          {CLIPS.map(({ emotion }, i) => (
            <button
              key={emotion}
              type="button"
              aria-pressed={i === clipIndex}
              onClick={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "nearest",
                })
                play(i)
              }}
              className={cn(
                "flex h-11 shrink-0 items-center rounded-full px-4.5 text-label transition-[background-color,color,box-shadow]",
                i === clipIndex
                  ? "bg-pill text-foreground shadow-pill"
                  : "text-muted-foreground hover:bg-pill-hover hover:text-foreground"
              )}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TranscriptLine({
  line,
  offset,
  elapsed,
  showAll,
  className,
}: {
  line: Line
  offset: number
  elapsed: number
  showAll: boolean
  className?: string
}) {
  return (
    <>
      <span className={cn("text-body-sm", className)}>{line.lang}</span>
      <p className={cn("text-label text-pretty", className)}>
        {line.words.map(([text, start], i) => {
          const visible = showAll || elapsed >= offset + start
          return (
            <span
              key={start}
              className={cn(
                "transition-opacity duration-200 ease-out",
                visible ? "opacity-100" : "opacity-0"
              )}
            >
              {i > 0 ? " " : null}
              {text}
            </span>
          )
        })}
      </p>
    </>
  )
}

const RING_RADIUS = 25

function PlayButton({
  playing,
  progress,
  onClick,
}: {
  playing: boolean
  progress: number
  onClick: () => void
}) {
  const circumference = 2 * Math.PI * RING_RADIUS
  const Icon = playing ? Pause : Play

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playing ? "Pause" : "Play"}
      className="relative grid size-13.5 shrink-0 place-items-center rounded-full"
    >
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 54 54"
        aria-hidden
      >
        <circle
          cx="27"
          cy="27"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn(
            "text-foreground transition-opacity",
            progress > 0 && progress < 1 ? "opacity-100" : "opacity-0"
          )}
        />
      </svg>
      <span className="grid size-11 place-items-center rounded-full bg-control shadow-control transition-transform active:scale-95">
        <Icon className="size-4 fill-current" strokeWidth={0} />
      </span>
    </button>
  )
}
