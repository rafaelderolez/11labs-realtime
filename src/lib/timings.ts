/** A word and its start time relative to its clip's audio (s). */
export type Word = [text: string, start: number]

/** What the audio generators record per clip, keyed by its public path. */
export type ClipTiming = { duration: number; words: Word[] }

/** Looks up a clip's timing in a generated timings file. */
export function timingFor(timings: object, src: string): ClipTiming {
  const timing = (timings as Record<string, ClipTiming | undefined>)[src]
  if (!timing) throw new Error(`No timings for ${src}; regenerate the audio`)
  return timing
}

/** The words joined back into the line they were read from. */
export const lineText = (words: Word[]) => words.map(([word]) => word).join(" ")
