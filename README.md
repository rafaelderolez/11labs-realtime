# Eleven Realtime Translate

A product landing page for a live speech-to-speech translation feature, built
as a Design Engineer take-home for ElevenLabs.

**Live:** [elevenlabs.derolez.dev](https://elevenlabs.derolez.dev)

The page has two interactive demos, both driven by real ElevenLabs audio:

- **Translated call.** A looping phone call between a French and an English
  speaker. Each turn appears as a card, word by word, in sync with the voices.
  Press **Listen** to hear it, with each speaker panned to their own side.
- **Live translation.** Five emotion clips, each a line and its translation
  read by the same voice. A canvas globe of letters reacts to each emotion.
  The settings panel beside it shows the configuration the clip used.

## Getting started

Requires Node 24 and pnpm 10.

```bash
pnpm install
pnpm dev
```

The generated audio and timings are committed, so no API key is needed to run
the site.

| Command                     | What it does                        |
| --------------------------- | ----------------------------------- |
| `pnpm dev`                  | Start the Vite dev server           |
| `pnpm build`                | Type-check and build to `dist/`     |
| `pnpm preview`              | Serve the production build          |
| `pnpm typecheck`            | Type-check the app and the scripts  |
| `pnpm lint` / `pnpm format` | Lint with oxlint, format with oxfmt |
| `pnpm deadcode`             | Find unused files, exports and deps |

In the browser, press <kbd>D</kbd> to toggle dark mode and <kbd>G</kbd> to
show the layout grid.

## Project structure

```
src/
├── main.tsx              Providers: theme, reduced motion, lazy Motion features
├── App.tsx               The page, section by section
├── components/
│   ├── sections/         One component per page section
│   ├── demos/            The interactive demos and their parts
│   └── ui/               Primitives: shadcn button, pickers, ElevenLabs UI orb
├── hooks/                Audio playback hooks and page-idle detection
├── lib/                  Framework-free logic
│   ├── audio.ts          Web Audio helpers: loading, ducking, fades
│   ├── call-schedule.ts  Lays the call out on a single timeline
│   ├── emotion-clips.ts  Pairs each clip with its word timings
│   └── letter-globe/     The globe's moods, shapes and canvas renderer
├── content/              Scripts, voices and generated timings (data only)
└── styles/               Grid and type scale, imported by index.css
scripts/                  Generators for the audio, timings and voice options
public/audio/             Generated clips, served as static files
```

Code is layered: `components` render, `hooks` own React state and effects,
`lib` holds logic with no React in it, and `content` is data only. Each layer
imports only from the layers below it.

## How it works

### Content pipeline

Everything you hear and read comes from `src/content/`. The scripts in
`scripts/` send that text to the ElevenLabs text-to-speech API. They save each
clip to `public/audio/` and its word start times to a timings JSON beside the
script. At runtime the demos pair the two. If a script line no longer matches
its timings, the page throws at load rather than drifting out of sync.

To regenerate, add `ELEVENLABS_API_KEY` to `.env.local` and run:

```bash
pnpm audio:call          # the translated call
pnpm audio:emotions      # emotion clips; only new or changed ones (--force for all)
pnpm translate:options   # languages and voices for the settings panel
```

### Audio and timing

Both demos use the Web Audio API, not `<audio>` elements. Every clip is
scheduled on the audio context's clock, so playback stays sample-accurate. The
translation starts a fixed lag after the original, and the original ducks under
it.

- The call is laid out once as a timeline in `lib/call-schedule.ts`.
  `useCall` runs a looping clock over it. While muted, the clock follows frame
  time; with sound on, it follows the audio context, so the words stay locked
  to the voices.
- `useLiveTranslation` plays one clip at a time. It handles pause and resume,
  crossfades when you switch emotion mid-clip, and ignores stale loads.

### Performance

- three.js (the orb) and audio decoding wait until the page is idle
  (`usePageIdle`), so they don't compete with first paint.
- Motion features load lazily through `LazyMotion`.
- A small Vite plugin preloads the two fonts the first screen uses.
- The globe and the call clock pause when off screen.
- Fingerprinted assets are served with a one-year immutable cache
  (`public/_headers`).

### Accessibility

- Motion respects `prefers-reduced-motion`: the call shows its finished
  state, and the globe is not rendered.
- The animated call is `aria-hidden`, with a plain transcript for screen
  readers. Lines are tagged with their language.
- Controls are native buttons with `aria-pressed` state.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui on Base UI, Motion,
react-three-fiber. Deployed as static assets on Cloudflare Workers.

## Tooling

A pre-commit hook (simple-git-hooks and lint-staged) lints and formats staged
files, then runs the dead-code and React Doctor checks.
