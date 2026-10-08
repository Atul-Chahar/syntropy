# Syntropy

Syntropy is a calm, scientific health companion that treats training and nutrition as one loop.
It is a personal daily-driver Android app and a portfolio project. It is built on the training
engine and AI Coach pipeline of OpenGym v1.3.8 (AGPL-3.0), with a new Next.js UI, Indian-food
nutrition with Gemini photo analysis, an AI chat coach, adaptive targets, and Android widgets.

- Product brief: `docs/PRD.md`
- Architecture and decisions: `docs/ARCHITECTURE.md`
- Build phases: `docs/BUILD_PLAN.md`
- Screens, routes, data shapes, Gemini contract: `docs/SCREENS.md`
- Pages missing from the designs: `docs/DESIGN_GAPS.md`

## Decisions (settled, do not reopen without the owner)

- **Phone-only, local-first.** No server. All data lives on the device; backup is an export file.
  A public web demo build uses seed data.
- **Android only.** No iOS widgets or Live Activity.
- **No accounts.** SignUp creates a local profile; the Passkey/SignIn designs are a biometric
  app lock (enrol, unlock).
- **AI = Gemini API free tier, called from the phone.** The user pastes their own key; it is
  stored in the Android Keystore via secure storage and never bundled, logged, exported or synced.
  No on-device models. Model names are a setting (defaults: `gemini-3.8-flash` for vision and
  coach, `gemini-3.5-flash-lite` for chat and text parsing).
- **Next.js (static export) + Motion** for the UI, inside Capacitor 8.
- **Missing pages are designed by Claude in the same design system**, shown to the owner as a
  390 x 844 screenshot for approval before real data is wired.

## Repo map

```
apps/app        Next.js app (output: 'export') + Capacitor Android (apps/app/android)
apps/site       Next.js landing page (phase 13)
packages/ui     design system: tokens.css, sy components, icons, motion presets
packages/core   OpenGym training engine (JS) + generated .d.ts
packages/ai     Gemini client, coach pipeline (from OpenGym api/coach/core), coach client
packages/nutrition  Indian food table, units, targets, energy balance
design/         Claude Design boards (*.dc.html) and the original tokens.css
docs/           PRD, architecture, build plan, screens, design gaps
```

## Source of truth for the UI

- Every designed screen is in `design/screens/*.dc.html`: HTML mockups with inline styles, a
  missing runtime (`support.js`), `{{name}}` values from the script block at the bottom, which
  also holds the sample data and interaction logic. Read them as markup references; they do not run.
- Tokens: `packages/ui/src/tokens.css` (extended from `design/tokens.css`). Use variables and
  classes; never hard-code a colour that has a token. Add a token when a design colour lacks one.
- Phone boards are 390 x 844. The app is fluid from 360 to 430 px and respects
  `env(safe-area-inset-*)`. Never draw a fake status bar.
- Match sizes, radii, colours, copy and motion from the board exactly. When a screen is built,
  compare a 390 x 844 screenshot against the board value by value.

## Look and feel

- Dark first. Ground `--sy-void`, text `--sy-bone`. Accents: sage (nutrition, recovery, "good"),
  ember (training, energy), peach (highlights), water blue (hydration only).
- Frosted glass cards (`.sy-glass`, `.sy-glass-dark`), pill buttons, 44 px minimum touch targets.
- Fonts (self-hosted by `next/font`): Geist (UI, 300 for big titles), Doto (metric numbers only),
  Geist Mono (small uppercase kickers).
- Tone is calm and non-judgmental. No red error walls for going over a target.
- Motion is subtle: fades, gentle floats, spring-like eases. Always honour reduced motion.
- Numbers in the designs are sample data. Real values come from the stores.

## Code conventions

- TypeScript (strict) for new code; function components and hooks. Biome formats and lints
  (single quotes, no semicolons, 2 spaces, width 100). Run `pnpm lint`.
- Styling: `packages/ui` components use CSS Modules; screens port board values 1:1 as style objects. No Tailwind.
- Motion: `motion/react` for springs, gestures, sheets, layout and screen transitions, number
  tweens. Ambient loops (orbs, pulses, scan line, marquee) stay as CSS keyframes.
  Wrap the app in `MotionConfig reducedMotion="user"`.
- Accessibility: real `<button>`, `<a>`, `<input>` with `<label>`; `aria-label` on icon-only
  buttons; ARIA roles on the custom primitives (dialog sheets, tabs, radio groups, switches).
- Static export rules: every screen is a client component; no route handlers, server actions,
  middleware or `next/image` optimisation; ids go in the query string (`/meal/review?id=`).
- State: one Zustand store per domain in `apps/app/src/stores` (training keeps OpenGym's `S`
  shape so `@syntropy/core` works unchanged; nutrition, water, goal, profile, coach, ui).
  Persistence goes through `apps/app/src/platform/storage` (Filesystem JSON on native,
  IndexedDB on web). Photos are files, never state.
- Native access only through `apps/app/src/platform/*` adapters, each with a web fallback.
- Upstream code in `packages/core/src` and `packages/ai/src/coach` keeps OpenGym's style and
  is excluded from Biome. Change it minimally, keep its tests passing, and note why in the commit.
- Every AI estimate is shown to the user to confirm or edit before it is saved. AI calls have a
  timeout, one retry, a daily cap, and a friendly fallback.

## Commands

```
pnpm install               # once
pnpm dev                   # app at http://localhost:3000
pnpm build | test | typecheck | lint
pnpm --filter @syntropy/app android      # build, sync and run on a device or emulator
pnpm --filter @syntropy/ai assets        # regenerate coach prompts after editing prompts/*.md
```

Toolchain is pinned in `mise.toml` (Java 21, `ANDROID_HOME`). Node >= 22.12, pnpm 11.

## Working rules for Claude

- One phase from `docs/BUILD_PLAN.md` at a time. Read the relevant boards before building.
- For a page with no board, design it from existing primitives, flag any new primitive, and show
  the owner a screenshot before wiring data.
- After each phase: build, run all tests, screenshot changed screens, fix failures, summarise in
  plain language. Commit per phase when the owner agrees.
- Licence: AGPL-3.0-or-later. Keep `LICENSE` and `NOTICE.md`. Never add third-party exercise
  media that isn't openly licensed (ExerciseDB/Gym visual images and GIFs, free-exercise-db photos),
  not even hotlinked. Exception: ExerciseDB's free V1 API animations (non-commercial, attribution
  "Animation: ExerciseDB") are streamed at runtime by `components/ExerciseMedia.tsx` via the id map
  in `lib/exercisedb-map.json`; never commit, bundle or cache those GIF files into the repo or APK.
