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
│  Native: Glance widgets ◄── SharedPreferences snapshot ── app         │
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
| `packages/nutrition` | Indian food table, units, targets, energy balance, weight EMA (phase 6) | New |

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
- **Coach.** OpenGym's pipeline: an allowlisted payload of the user's data, a fixed system
  prompt, JSON output, a validator and one repair round. Syntropy adds nutrition summaries to the
  payload and a free chat mode. Plan changes arrive as proposals the user applies or refines.
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
- **Widgets:** the Capacitor widget bridge is community-maintained; the widget UI is native Kotlin.
- **Keystore:** the key is lost if the app is uninstalled; the user re-enters it.
- **AGPL:** every distributed build must point to its source.

## Known issues

- Android shows light system bars around the WebView; fixed with edge-to-edge in phase 2.
