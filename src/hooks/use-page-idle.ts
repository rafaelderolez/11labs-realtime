import { useSyncExternalStore } from "react"

/**
 * Flips once the page has loaded and the main thread is free, so heavy
 * extras (three.js, audio) don't compete with the first paint.
 */
let idle = false
const listeners = new Set<() => void>()

function markIdle() {
  idle = true
  for (const listener of listeners) listener()
  listeners.clear()
}

function waitForIdle() {
  const whenFree = () =>
    "requestIdleCallback" in window
      ? requestIdleCallback(markIdle, { timeout: 2000 })
      : setTimeout(markIdle, 200)
  if (document.readyState === "complete") whenFree()
  else window.addEventListener("load", whenFree, { once: true })
}

if (typeof window !== "undefined") waitForIdle()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePageIdle() {
  return useSyncExternalStore(
    subscribe,
    () => idle,
    () => false
  )
}
