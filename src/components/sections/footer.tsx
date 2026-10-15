import { ArrowUpRight, Speech } from "lucide-react"

import { Logo } from "@/components/logo"

const REPO_URL = "https://github.com/rafaelderolez/11labs-realtime"

export function Footer() {
  return (
    <footer className="page-grid divider-t gap-y-16 pt-20 pb-10 lg:gap-y-40 lg:pt-50">
      <div className="grid grid-cols-subgrid gap-y-7">
        <h2 className="col-span-12 px-content font-heading text-heading text-trim lg:col-span-6 lg:col-from-1">
          Hey ElevenLabs design team
          <span className="block text-tertiary-foreground">
            Thanks for reviewing!
          </span>
        </h2>
        <div className="col-span-12 flex flex-col gap-10 px-content lg:col-span-5 lg:col-from-7 lg:px-0">
          <p className="text-body text-pretty text-trim sm:text-title">
            I hope this gives a sense of how I think about my work, and I'd love
            to keep the conversation going.
          </p>
          <ul className="flex flex-col gap-2 text-label-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              {/* Nudged so its ink centers on the GitHub mark below; the glyph sits high and left in its box. */}
              <Speech
                className="size-4 translate-x-[1.5px] translate-y-[0.5px]"
                strokeWidth={1.75}
                aria-hidden
              />
              Say hi to Tom Parkes
            </li>
            <li className="flex">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <GitHubIcon className="size-4 p-[1.5px]" />
                View the code on GitHub
                <ArrowUpRight
                  className="-ml-1 size-3.5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between px-content text-label-sm text-muted-foreground">
        <Logo className="h-3 w-auto text-foreground" />
        <p>Rafael Derolez</p>
      </div>
    </footer>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
