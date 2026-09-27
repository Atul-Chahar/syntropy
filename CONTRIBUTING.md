# Contributing to Syntropy

Thanks for helping! Syntropy is a pnpm + Turborepo monorepo. Five minutes to a running app:

```bash
pnpm install
pnpm dev          # http://localhost:3000 → "Explore with sample data"
pnpm test         # engine, nutrition and AI unit tests
pnpm lint         # Biome (format + lint)
```

## Where things live

| Path | What |
| --- | --- |
| `apps/app/src/screens` | One file per screen, ported from `design/screens/*.dc.html` |
| `apps/app/src/stores` | Zustand stores (training keeps OpenGym's state shape) |
| `apps/app/src/platform` | Native adapters with web fallbacks (storage, camera, biometric, widgets) |
| `packages/ui` | Design system — reuse these components before writing new ones |
| `packages/nutrition/src/foods.ts` | The Indian food table |
| `packages/ai/src/gemini` | Gemini client, meal and text parsing, coach chat |
| `packages/core` | OpenGym's engine — keep changes minimal and tests green |

## Good first contributions

- **Food data.** Add or correct dishes in `packages/nutrition/src/foods.ts`. Values are per *one* unit (pc, katori 150 g, cup, glass, plate). Keep macros consistent with calories (the tests check it) and mention your source in the PR.
- **Accessibility.** Labels, focus order, contrast.
- **Translations** (planned): Hindi first.

## Rules of the road

- Match the design boards: sizes, radii, colours and copy come from `design/screens`. Tokens live in `packages/ui/src/tokens.css`; never hard-code a colour that has a token.
- Calm, non-judgmental copy. No red walls for going over a target.
- Every AI estimate must be confirmed by the user before it is saved. Never send more data to Gemini than the AI settings screen lists.
- Add tests for logic (Vitest) and a Playwright flow for new user journeys (`apps/app/e2e`).
- Upstream OpenGym code (`packages/core/src`, `packages/ai/src/coach`) keeps its own style and is excluded from Biome.

By contributing you agree your work is licensed under the AGPL-3.0-or-later.
