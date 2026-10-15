import { useEffect, useRef, useState } from "react"

import { duck, fadeOut, fetchAudioBuffer } from "@/lib/audio"
import { CLIPS } from "@/lib/emotion-clips"

/** How long after the source the translation starts (s). */
export const TRANSLATION_DELAY = 1
/** Fade-out when switching clips mid-playback (s). */
const SWITCH_FADE = 0.25

type Status = "idle" | "playing" | "paused" | "ended"

type Playback = {
  output: GainNode
  nodes: AudioBufferSourceNode[]
  startTime: number
  duration: number
}

/**
 * Plays one emotion clip at a time: the source line, then its translation
 * TRANSLATION_DELAY later with the source ducked beneath it.
 */
export function useLiveTranslation(onClipChange?: (index: number) => void) {
  const [clipIndex, setClipIndex] = useState(0)
  const [status, setStatus] = useState<Status>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)

  const ctxRef = useRef<AudioContext | null>(null)
  const buffersRef = useRef(new Map<string, Promise<AudioBuffer>>())
  const playbackRef = useRef<Playback | null>(null)
  const frameRef = useRef(0)
  const playIdRef = useRef(0)

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current)
      void ctxRef.current?.close()
    }
  }, [])

  function loadBuffer(ctx: AudioContext, src: string) {
    let buffer = buffersRef.current.get(src)
    if (!buffer) {
      buffer = fetchAudioBuffer(ctx, src)
      buffersRef.current.set(src, buffer)
    }
    return buffer
  }

  function tick() {
    const ctx = ctxRef.current
    const playback = playbackRef.current
    if (!ctx || !playback) return

    const time = ctx.currentTime - playback.startTime
    if (time >= playback.duration) {
      setElapsed(playback.duration)
      setStatus("ended")
      return
    }

    setElapsed(Math.max(time, 0))
    frameRef.current = requestAnimationFrame(tick)
  }

  function stopPlayback(ctx: AudioContext, fade: boolean) {
    const playback = playbackRef.current
    if (!playback) return 0
    playbackRef.current = null

    const fadeTime = fade ? SWITCH_FADE : 0
    fadeOut(playback.output, fadeTime)
    for (const node of playback.nodes) node.stop(ctx.currentTime + fadeTime)
    return fadeTime
  }

  async function play(index: number) {
    const playId = ++playIdRef.current
    const ctx = (ctxRef.current ??= new AudioContext())
    const wasPlaying = status === "playing"
    if (ctx.state === "suspended") await ctx.resume()

    cancelAnimationFrame(frameRef.current)
    const fadeTime = stopPlayback(ctx, wasPlaying)

    const clip = CLIPS[index]
    setClipIndex(index)
    onClipChange?.(index)
    setElapsed(0)
    setStatus("playing")

    const [sourceBuffer, translationBuffer] = await Promise.all([
      loadBuffer(ctx, clip.source.src),
      loadBuffer(ctx, clip.translation.src),
    ])
    // A newer play() started while this clip was loading.
    if (playId !== playIdRef.current) return

    const t0 = ctx.currentTime + Math.max(fadeTime, 0.05)

    const output = ctx.createGain()
    output.connect(ctx.destination)

    const sourceGain = ctx.createGain()
    duck(sourceGain, t0 + TRANSLATION_DELAY)
    sourceGain.connect(output)

    const sourceNode = ctx.createBufferSource()
    sourceNode.buffer = sourceBuffer
    sourceNode.connect(sourceGain)
    sourceNode.start(t0)

    const translationNode = ctx.createBufferSource()
    translationNode.buffer = translationBuffer
    translationNode.connect(output)
    translationNode.start(t0 + TRANSLATION_DELAY)

    const total = Math.max(
      sourceBuffer.duration,
      TRANSLATION_DELAY + translationBuffer.duration
    )
    playbackRef.current = {
      output,
      nodes: [sourceNode, translationNode],
      startTime: t0,
      duration: total,
    }
    setDuration(total)
    frameRef.current = requestAnimationFrame(tick)
  }

  async function toggle() {
    const ctx = ctxRef.current

    // Nothing to pause or resume until the first play makes the context.
    if (!ctx) {
      await play(clipIndex)
      return
    }

    switch (status) {
      case "playing":
        await ctx.suspend()
        cancelAnimationFrame(frameRef.current)
        setStatus("paused")
        break
      case "paused":
        await ctx.resume()
        setStatus("playing")
        frameRef.current = requestAnimationFrame(tick)
        break
      case "idle":
      case "ended":
        await play(clipIndex)
        break
    }
  }

  return {
    clip: CLIPS[clipIndex],
    clipIndex,
    status,
    elapsed,
    duration,
    toggle,
    play,
  }
}
