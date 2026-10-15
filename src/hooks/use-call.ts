import { useEffect, useRef, useState } from "react"

import { duck, fadeOut, fetchAudioBuffer } from "@/lib/audio"
import { LINES, SCHEDULE } from "@/lib/call-schedule"

/** Each voice sits on its speaker's side of the stereo field. */
const PAN = 0.6

export type CallBuffers = Map<string, AudioBuffer>

type Audio = {
  ctx: AudioContext
  buffers: CallBuffers
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
      if (line === said) duck(gain, heardAt)
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
async function fetchBuffers(): Promise<CallBuffers> {
  // Decoding needs no sound, so an offline context does it without tripping
  // the autoplay policy.
  const decoder = new OfflineAudioContext(1, 1, 44100)
  return new Map(
    await Promise.all(
      LINES.map(
        async ({ src }) => [src, await fetchAudioBuffer(decoder, src)] as const
      )
    )
  )
}

// Shared across renders, so the lines are only fetched once. If loading fails,
// the call just plays on without sound.
let buffersPromise: Promise<CallBuffers | null> | null = null
export const loadCallBuffers = () =>
  (buffersPromise ??= fetchBuffers().catch(() => null))

/**
 * A looping clock for the call. Silent, it runs on frame time; with sound on,
 * it follows the audio context so the words stay locked to the voices.
 */
export function useCall(inView: boolean, reduceMotion: boolean | null) {
  const [time, setTime] = useState(0)
  const [sound, setSound] = useState(false)
  // Reduced motion holds the visuals still, so the clock only runs to keep
  // the audio looping.
  const running = inView && (!reduceMotion || sound)
  const timeRef = useRef(0)
  const audioRef = useRef<Audio | null>(null)

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

  function toggleSound(buffers: CallBuffers) {
    const current = audioRef.current
    if (current) {
      audioRef.current = null
      setSound(false)
      fadeOut(current.output, 0.2)
      setTimeout(() => void current.ctx.close(), 300)
      return
    }

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

  return { time, sound, toggleSound }
}
