# Syntropy

**Order, built from chaos.** A calm, scientific health companion that treats training and
nutrition as one loop. It's built for Indian plates and runs privately on your phone.

> Status: **Phase 0, foundation.** The monorepo, the training engine and the Android shell are
> working. Features arrive phase by phase; see [the build plan](docs/BUILD_PLAN.md).

## What it does (planned)

- **Photo nutrition for Indian food.** Photograph a thali and Gemini identifies roti, dal,
  sabzi and dahi in pieces and katoris. You confirm or adjust, and "Ate more later?" adds a
  second helping to the same meal.
- **Training that remembers.** Splits, a set-by-set logger with RPE and a rest timer,
  progression, estimated one-rep max, and a fatigue map. The engine and its 1,324 exercises
  come from [OpenGym](https://github.com/DuarteSantos8/openGym).
- **Synthesis.** Energy in against energy out on one homeostasis dial. Training-aware macro
  targets adjust every week from your weight trend.
- **AI coach.** Chat about your own data, and get plan proposals you can apply or refine.
- **Widgets.** Today's calories and water, one-tap water, scan a plate, quick-add roti or chai.
- **Private by design.** No account, no server, and a fingerprint lock. Data stays on the
  device. The only network calls go to Gemini, using your own API key.

## Tech

| | |
| --- | --- |
| App | Next.js (static export) · React 19 · TypeScript · Zustand · Motion |
| Mobile | Capacitor 8 (Android) · Jetpack Glance widgets |
| AI | Gemini API (vision with JSON-schema output, chat) |
| Design | Hand-built design system from Claude Design boards · CSS Modules · Radix primitives |
| Tooling | pnpm workspaces · Turborepo · Biome · Vitest · Playwright · GitHub Actions |

```
apps/app        the Android app (Next.js + Capacitor)
apps/site       landing page
packages/ui     design system
packages/core   training engine (from OpenGym v1.3.8)
packages/ai     Gemini client and coach pipeline
design/         the original design boards
docs/           PRD, architecture, build plan, screens
```

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run it

Requirements: Node 22.12+, pnpm 11, and for Android, Java 21 and the Android SDK. The versions
are pinned in `mise.toml`.

```bash
pnpm install
pnpm dev                                   # app at http://localhost:3000
pnpm test                                  # all packages
pnpm --filter @syntropy/app android        # build and run on a device or emulator
```

## Credits and licence

Syntropy is a derivative of [OpenGym](https://github.com/DuarteSantos8/openGym) by Duarte Santos.
It is licensed under the **GNU AGPL v3.0 or later**. Third-party notices, including the exercise
data and body-map geometry, are in [NOTICE.md](NOTICE.md). Exercise images and animations are
not part of this project.
