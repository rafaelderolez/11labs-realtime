// Adapted from ElevenLabs UI (https://ui.elevenlabs.io/docs/components/voice-picker)
// for Base UI. The list shows a static swatch per voice and only mounts an Orb
// for the one previewing: a WebGL canvas per row would run past the browser's
// context limit with a few hundred voices.

import * as React from "react"
import { Pause, Play } from "lucide-react"

import { Combobox, ComboboxItem } from "@/components/ui/combobox"
import { Orb } from "@/components/ui/orb"
import { cn } from "@/lib/utils"

export type PickerVoice = {
  id: string
  name: string
  description?: string
  previewUrl?: string
}

type Preview = {
  playingId: string | null
  toggle: (id: string, src: string) => void
}

const PreviewContext = React.createContext<Preview | null>(null)

function usePreview() {
  const preview = React.useContext(PreviewContext)
  if (!preview) throw new Error("VoicePickerItem must be inside VoicePicker")
  return preview
}

function VoicePicker({
  value,
  selectedId = value?.id,
  trigger,
  children,
  open,
  onOpenChange,
  id,
  className,
}: {
  /** Voice shown in the trigger; its id picks the swatch colors. */
  value?: PickerVoice
  /** The selected item's id, when it differs from the voice shown. */
  selectedId?: string
  /** Trigger text, when it should differ from the voice name. */
  trigger?: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  id?: string
  className?: string
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = React.useState<string | null>(null)

  const stop = React.useCallback(() => {
    audioRef.current?.pause()
    setPlayingId(null)
  }, [])

  const toggle = React.useCallback(
    (voiceId: string, src: string) => {
      if (playingId === voiceId) return stop()
      audioRef.current?.pause()
      const audio = new Audio(src)
      audio.onended = () => setPlayingId(null)
      audioRef.current = audio
      setPlayingId(voiceId)
      audio.play().catch(() => setPlayingId(null))
    },
    [playingId, stop]
  )

  React.useEffect(() => stop, [stop])

  return (
    <PreviewContext.Provider value={{ playingId, toggle }}>
      <Combobox
        id={id}
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) stop()
          setInternalOpen(next)
          onOpenChange?.(next)
        }}
        value={selectedId}
        label={trigger ?? value?.name}
        icon={value ? <VoiceSwatch id={value.id} className="size-6" /> : null}
        placeholder="Search voices..."
        empty="No voice found."
        className={className}
      >
        {children}
      </Combobox>
    </PreviewContext.Provider>
  )
}

function VoicePickerItem({
  voice,
  orbId = voice.id,
  isSelected,
  onSelect,
}: {
  voice: PickerVoice
  /** Voice whose orb and colors to show, when the item stands in for another. */
  orbId?: string
  isSelected: boolean
  onSelect: () => void
}) {
  const { playingId, toggle } = usePreview()
  const isPlaying = playingId === voice.id
  const preview = voice.previewUrl

  return (
    <ComboboxItem
      value={voice.id}
      keywords={[voice.name, voice.description ?? ""]}
      onSelect={onSelect}
      isSelected={isSelected}
      className="gap-3"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={isPlaying ? `Stop ${voice.name}` : `Preview ${voice.name}`}
        disabled={!preview}
        onPointerDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation()
          if (preview) toggle(voice.id, preview)
        }}
        className="group/preview relative size-7 shrink-0 rounded-full"
      >
        {isPlaying ? (
          <Orb
            agentState="talking"
            colors={orbColors(orbId)}
            seed={hash(orbId)}
            className="pointer-events-none absolute inset-0"
          />
        ) : (
          <VoiceSwatch id={orbId} className="absolute inset-0 size-full" />
        )}
        {preview ? (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/preview:opacity-100",
              isPlaying && "bg-transparent backdrop-blur-none"
            )}
          >
            {isPlaying ? (
              <Pause className="size-3" fill="currentColor" />
            ) : (
              <Play className="size-3" fill="currentColor" />
            )}
          </span>
        ) : null}
      </button>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{voice.name}</span>
        {voice.description ? (
          <span className="truncate text-label-xs text-muted-foreground">
            {voice.description}
          </span>
        ) : null}
      </span>
    </ComboboxItem>
  )
}

function hash(id: string) {
  let h = 0
  for (const char of id) h = (h * 31 + char.charCodeAt(0)) | 0
  return Math.abs(h)
}

function orbColors(id: string): [string, string] {
  const hue = hash(id) % 360
  return [`hsl(${hue}, 70%, 85%)`, `hsl(${(hue + 60) % 360}, 50%, 72%)`]
}

/** A soft gradient swatch in the voice's orb colors. */
function VoiceSwatch({ id, className }: { id: string; className?: string }) {
  const [from, to] = orbColors(id)
  return (
    <span
      aria-hidden
      className={cn("size-4 shrink-0 rounded-full", className)}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${from}, ${to})`,
      }}
    />
  )
}

export { VoicePicker, VoicePickerItem, VoiceSwatch }
