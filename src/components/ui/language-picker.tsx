// Round flag per language, modeled on the ElevenLabs language select. Flags are
// circle-flags (MIT, https://github.com/HatScripts/circle-flags) copied into
// public/flags, one per language code.

import { cn } from "@/lib/utils"

function LanguageFlag({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  return (
    <img
      src={`/flags/${code}.svg`}
      alt=""
      loading="lazy"
      className={cn("size-4 shrink-0 rounded-full", className)}
    />
  )
}

export { LanguageFlag }
