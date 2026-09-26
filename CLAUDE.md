# Syntropy

Syntropy is a calm, scientific health companion that treats training and nutrition as one loop.
It is a fork of OpenGym (React 19 + Vite + React Router + Zustand frontend, framework-free Node API,
passkey auth with @simplewebauthn/server, JSON file storage). We are adding a full redesign, AI photo
nutrition with Gemini (built for Indian food), water tracking, goal-based targets, a Capacitor mobile
shell, home and lock screen widgets, and a landing page.

Full product brief: `docs/PRD.md`. Build order and phase prompts: `docs/BUILD_PLAN.md`.
Screen-by-screen spec: `docs/SCREENS.md`.

## Source of truth for the UI

- Every screen is designed in `design/screens/*.dc.html`. These are HTML mockups with inline styles.
  Read them for exact layout, spacing, sizes, colours, copy and interaction states.
  They use a small runtime (`support.js`, not included), so do not try to run them. Treat them as markup references.
- `{{name}}` in a design file is a value that comes from the script block at the bottom of that file.
  The script shows the sample data and the interaction logic (steppers, toggles, state changes).
- Design tokens live in `design/tokens.css`. Import it once at the app root and use its variables and classes.
  Never hard-code a colour that already has a token.
- Phone designs are 390 x 844. The real app must be fluid from 360 to 430 px wide and respect safe areas
  (`env(safe-area-inset-*)`). Do not draw a fake status bar.

## Look and feel rules

- Dark first. Ground `--sy-void`, text `--sy-bone`. Accents: sage (nutrition, recovery, "good"),
  ember (training, energy), peach (highlights), water blue (hydration only).
- Frosted glass cards (`.sy-glass`), pill buttons, 44 px minimum touch targets.
- Fonts: Geist (UI, light 300 for big titles), Doto (dot-matrix, only for metric numbers),
  Geist Mono (small uppercase kickers). Load from Google Fonts.
- Tone is calm and non-judgmental. No red error walls for going over a target; use neutral copy.
- Motion is subtle: fades, gentle floats, spring-like eases. Always honour `prefers-reduced-motion`.
- Numbers in the designs are sample data. Real values come from the store and the API.

## Code conventions

- TypeScript for new code. Function components and hooks. Zustand stores per domain
  (`useNutritionStore`, `useWaterStore`, `useGoalStore`, existing training stores).
- Shared UI components in `frontend/src/components/sy/` (GlassCard, PillButton, Segmented, Stepper,
  Ring, Gauge, TabBar, Orbs, Grain, MetricNumber). Build them once, reuse everywhere.
- Real `<button>`, `<a>`, `<input>` with `<label>`. `aria-label` on icon-only buttons.
- Keep the API framework-free like upstream OpenGym. New routes go under `/api/...`.
- Secrets (Gemini API key) live only on the server in `.env`. Never ship them to the client.
- Every AI estimate is shown to the user to confirm or edit before it is saved.

## Working rules for Claude

- Work one phase from `docs/BUILD_PLAN.md` at a time. Start in plan mode, list the files you will touch,
  then build.
- Before changing an upstream OpenGym file, read it fully and keep existing behaviour working.
- After each phase: run the app, run tests (`node --test` in `api/`, the frontend test runner if present),
  fix failures, then summarise what changed in plain language.
- Licence: OpenGym is GNU AGPL v3. Keep the licence file and notices. Anyone using a hosted copy
  must be able to get the source.
