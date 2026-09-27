# Architecture

Syntropy is a local-first Android app. A Next.js UI is exported as static files and runs inside
a Capacitor 8 WebView. Training logic comes from OpenGym v1.3.8. Nutrition, AI features and the
UI are new. There is no server: data lives on the phone, and the only network traffic is the
Gemini API, called with the user's own key.

```
┌──────────────────────── Android (Capacitor 8) ────────────────────────┐
│  WebView: apps/app (Next.js static export)                            │
│   screens ── stores (Zustand) ── @syntropy/core   (training engine)   │
│      │            │          └── @syntropy/nutrition (food, targets)  │
│      │            └─ platform/storage ─ Filesystem JSON / photos      │
│      └─ @syntropy/ui (tokens, components, Motion)                     │
│   @syntropy/ai ── platform/http (CapacitorHttp) ──► Gemini API        │
│        └─ key from platform/secrets (Android Keystore)                │
│  Native: RemoteViews widgets ◄── SharedPreferences snapshot ── app    │
└───────────────────────────────────────────────────────────────────────┘
```

## Packages

| Package | What it owns | Origin |
| --- | --- | --- |
| `apps/app` | Screens, routes, stores, platform adapters, Android project | New |
| `apps/site` | Landing page (static) | New |
| `packages/ui` | Tokens, `sy` components, icons, motion presets | New, from `design/` |
| `packages/core` | Exercises (1,324), history and volume, workout and set model, progression, e1RM, recovery and fatigue, supersets, starter plans, CSV/Hevy import | OpenGym `frontend/src/lib` |
| `packages/ai` | Coach pipeline (payload allowlist, prompts, provider adapters, validator, repair round), coach client (apply engine, insights, demo provider); Gemini vision and parsing (phase 7) | OpenGym `api/coach/core`, `frontend/src/lib/coach*.js`; new |
| `packages/nutrition` | Indian food table (170 foods), matching, units, targets, energy balance, weight EMA | New |

Dependency direction: `app → ui, core, ai, nutrition`; `ai → core`; `core` depends on nothing.
Upstream JS keeps its own style and tests; `@syntropy/core` ships generated `.d.ts` files
(`pnpm --filter @syntropy/core build`) so TypeScript code gets types.

## Runtime

- **Static export.** `next build` writes `apps/app/out`, which Capacitor copies into the APK
  and serves from `https://localhost`. No server rendering, route handlers, server actions or
  middleware. Runtime ids travel in the query string (`/meal/review?id=…`).
- **Navigation.** App Router paths with `trailingSlash`. The Android back button maps to
  `router.back()`. Widgets and notifications deep-link through `@capacitor/app` `appUrlOpen`.
- **Fonts** are self-hosted by `next/font`, so the app renders offline.
- **Web builds.** The same app runs in a browser for development and as the public demo
  (seed data, AI in demo mode). Every platform adapter has a web fallback.

## Data

- **Training state** keeps OpenGym's single `S` document (`routines`, `week`, `dayPlan`,
  `workouts`, `bodyweight`, `exWeights`, `customEx`, settings …) so engine functions work
  unchanged. The in-progress workout (`S.active`) is part of it.
- **New domains** get their own stores and files: nutrition (foods, meals), water, goal,
  profile, coach (chat, proposals, check-ins). Shapes are in `docs/SCREENS.md`.
- **Persistence** goes through `platform/storage`: a JSON file per store in the app's private
  Filesystem directory on Android, IndexedDB on the web. OpenGym's localStorage approach is not
  used, because its ~5 MB quota would not survive a year of meal logs.
- **Photos** (meal scans, progress milestones) are files referenced by id, never inline in state.
- **Backup** is an export of every store (without secrets) to a JSON file through the share
  sheet, and an import that validates before replacing.

## AI

- **Key.** The user pastes a Gemini API key in AI settings. It goes to the Android Keystore
  (`@aparajita/capacitor-secure-storage`) and is read only at request time. It is never in
  state, logs, exports or the bundle.
- **Transport.** Requests go straight to `generativelanguage.googleapis.com` with the key in the
  `x-goog-api-key` header, through CapacitorHttp on Android (no CORS) and `fetch` on the web.
- **Meal scan.** Photo → resize to 1280 px JPEG → Gemini with a JSON schema → validate → match
  names to the local Indian food table so quantities scale by unit (pc, katori) → user reviews
  and edits → saved. Nothing is logged without confirmation.
- **Coach chat.** A streaming chat grounded in an allowlisted summary built on the phone
  (`lib/coachContext.ts`): today's meals and targets, water, readiness, recent sessions, weight trend.
  Replies may end with an `ACTIONS:` line; actions are validated (known food ids, bounded amounts)
  and run only when the user taps them. OpenGym's plan pipeline (payload allowlist, JSON schema,
  validator, repair round) is packaged in `@syntropy/ai` for the plan-design screens still to come.
- **Adaptive targets.** Code, not the model, changes calorie targets: weekly weight trend vs
  planned rate moves targets by a bounded step. The model explains the change and suggests
  training adjustments.
- **Limits.** Free-tier rate limits apply, so every AI feature has a timeout, one retry and a
  local daily cap. Model names are a setting because they change often. On the free tier Google
  may use prompts and images to improve its products; the AI settings screen says so.

## Decisions

| Decision | Why |
| --- | --- |
| Hard fork of OpenGym v1.3.8, engine only | The reskin replaces the whole view layer; upstream moves too fast to merge |
| Next.js static export inside Capacitor | Owner's choice; export keeps it offline-capable in the WebView |
| Motion for interaction, CSS for ambient loops | Springs and gestures where they matter, zero cost for background loops |
| CSS Modules + tokens, no Tailwind | Board values port 1:1 and stay readable |
| TypeScript 6.0 | TypeScript 7 has no JavaScript API yet, which Next.js type checking uses |
| Phone-only, no accounts, biometric lock | Personal app; passkeys need a server and do not work in a WebView origin |
| No exercise images or GIFs in the repo or builds | Their licence is unresolved (see `NOTICE.md`) |

## Risks

- **Gemini free tier:** rate limits, model renames, and data use for product improvement.
- **Indian food accuracy:** mixed thalis and hidden oil are hard; the unit-based food table and
  mandatory review keep estimates honest.
- **WebView performance:** many stacked `backdrop-filter` layers can be slow on low-end phones.
  Measure on a real device and fall back to flat translucent fills when needed.
- **App Router transitions:** exit animations across routes are limited; use Motion within
  screens and the View Transition API between them.
- **Widgets:** RemoteViews layouts are basic by nature (no custom fonts or blur), so they follow the
  design's colours and shapes rather than its glass.
- **Keystore:** the key is lost if the app is uninstalled; the user re-enters it.
- **AGPL:** every distributed build must point to its source.

## Formulas

- **BMR** (Mifflin-St Jeor): `10·kg + 6.25·cm − 5·age + 5` (men) or `− 161` (women).
- **Maintenance** = BMR × daily-life factor (1.2 sitting · 1.3 light · 1.4 on-feet · 1.5 physical) + average daily training
  (`5.5 MET × kg × 1 h × sessions per week / 7`).
- **Targets** (Goal board): training day = maintenance + 100 + goal delta, rest day = maintenance − 100 + delta.
  Deltas: cut −250/−400/−600, gain +150/+250/+400, recomp −150. Protein 2.0 g/kg (1.8 to maintain), fat 0.9 g/kg,
  carbs fill the rest. Water = 35 ml/kg + 900 ml.
- **Energy out today** = BMR + BMR × (factor − 1) + logged training (`5.5 MET × kg × session hours`).
- **Weight trend**: exponential moving average with α = 0.1 per day, adjusted for gaps between weigh-ins.
- **Weekly check-in**: observed kg/week (trend over 14 days) vs planned `delta × 7 / 7700`. If they differ by
  ≥ 0.1 kg/week, the calorie target moves by `−diff × 7700 / 7`, rounded to 50 and capped at ±150 kcal.
- **Fatigue** (OpenGym): per-muscle stimulus from completed sets, 36-hour half-life, saturating curve; < 0.25 ready,
  ≤ 0.5 recovering, > 0.5 fatigued. **Readiness** = 100 − 42 × mean of the three most fatigued muscles.
- **Carb adjustment**: a lower-body session over 6 t of volume yesterday adds 40 g carbs today.

## Widgets and deep links

The app writes a small JSON snapshot (kcal, protein, water, next session) to SharedPreferences through a local
Capacitor plugin (`SyntropyWidgets`) after every change. Four `AppWidgetProvider`s render it with RemoteViews
(Today, Water, Scan plate, Quick add). Water and Quick add taps are handled by a `BroadcastReceiver` without opening
the app and queued; the app collects the queue after its stores have loaded and on every resume. Taps that open
the app use `syntropy://scan|food|plan` deep links, routed by `@capacitor/app`. RemoteViews was chosen over Jetpack
Glance to avoid a Kotlin/Compose toolchain for four simple layouts.

## Builds

- `pnpm --filter @syntropy/app build`: the Android app (sync with `npx cap sync android`).
- `NEXT_PUBLIC_SYNTROPY_DEMO=1`: the web demo — seeds sample data on first open, scans a sample plate and replies
  with scripted coach answers when no key is set, and exposes stores to the screenshot scripts.
- `NEXT_BASE_PATH`: sub-path hosting (GitHub Pages serves the site at `/syntropy/` and the demo at `/syntropy/demo/`).

## Tests

- Vitest: OpenGym engine (763), coach pipeline (241 + 71 node tests), nutrition (23), Gemini layer (16).
- Playwright (`apps/app/e2e`): onboarding, sample data, scan → review → log, Quick add parsing, water, a full
  workout, coach actions, and a crawl of every screen for runtime errors.
