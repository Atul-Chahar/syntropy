# Build plan

One phase at a time. Each phase ends with: build, all tests green, 390 x 844 screenshots of
changed screens next to their boards, the owner's review, then a commit and push.
Pages without a board (`docs/DESIGN_GAPS.md`) are designed by Claude in the same system and
approved from a screenshot before data is wired.

## Phase 0: monorepo foundation ✅

- pnpm + Turborepo monorepo, Biome, shared tsconfig, `mise.toml` toolchain (Java 21, Android SDK).
- OpenGym v1.3.8 engine imported unmodified, then packaged as `@syntropy/core` and `@syntropy/ai`
  (763 + 312 upstream tests passing).
- `apps/app`: Next.js static export + Capacitor 8 Android; runs on the emulator.
- `apps/site`: Next.js skeleton. Docs, notices, CI, public repo.

## Phase 1: design system (`packages/ui`) ✅

- Tokens extended with every colour, alpha step and keyframe the boards use but `tokens.css`
  lacks (peach, UI-sage and water RGB; `#FFC2A3`, `#FFB79A`, `#FFD6C4`, `#FF9C78`, `#D3E7F3`;
  text alphas .55, .72, .8; `sy-scan`, `sy-ring`, `sy-spin`, `sy-scanline`, `sy-marquee`).
- Components: GlassCard, Screen (orbs, grain, safe areas, bottom fade), ScreenHeader,
  ModalHeader, PillButton, IconButton, Segmented (pill and track), Tabs, Stepper (4 variants),
  Chip/Tag/Badge, TextField, InsightCallout, ProgressBar/SegmentBar, Ring, Gauge, MetricNumber,
  Kicker, BodyMap, Sparkline, BottomSheet, TabBar, CoachOrb; plus Switch, ListRow, EmptyState,
  Skeleton, Toast. Dot grid and EMA chart live in the Stats and Progress screens.
- 48 icons, brand mark, particle mark, coach orb. (A `/dev/ui` gallery is still to do.)

## Phase 2: app shell ✅

- Edge-to-edge dark system bars. Tab bar: Home · Train · Scan · Food · Stats.
- Route map from `docs/SCREENS.md`; modal flows hide the tab bar; screen transitions.
- Android back button; placeholders for screens not built yet.

## Phase 3: data layer ✅

- Stores and types; training keeps OpenGym's `S` shape.
- `platform/storage` (Filesystem JSON on Android, IndexedDB on web), photo files.
- Demo seed data; JSON export and import. Settings / Profile page.

## Phase 4: onboarding and lock ✅

- Welcome, SignUp (local profile), Passkey → biometric enrol, SignIn → unlock, App unlock.
- Body profile. Goal with maintenance from Mifflin-St Jeor.

## Phase 5: training ✅

- Boards: Plan (Coach card → `/coach`), Workout, Exercise, Library (body-map thumbnails), Stats,
  Recovery, Progress, all on `@syntropy/core`.
- Designed: routine builder, exercise picker, workout summary, weigh-in, history, exercise detail.

## Phase 6: nutrition without AI ✅

- `packages/nutrition`: ~150 Indian foods per unit (pc, katori 150 g, cup, plate), source cited,
  licence checked, every value marked as an estimate; targets and energy maths.
- Boards: FoodLog, QuickAdd (manual), water. Designed: meal detail, food search, custom food.

## Phase 7: Gemini meal scanning ✅

- AI settings (key in Keystore, models, test, usage).
- Scan: live viewfinder, gallery import, 1280 px JPEG, capture/analysing/error states.
- Gemini JSON → validate → match to the food table → Meal review with "Ate more later?".
- QuickAdd free-text parse. Nothing is saved until the user confirms.

## Phase 8: AI coach and adaptive plans ✅

- Coach intro, streaming chat with attachments and one-tap actions, AI settings, weekly check-in.
- Still to wire: OpenGym's plan-design intake and proposal review screens (the pipeline is in `@syntropy/ai`).
- Nutrition summaries in the coach payload; free chat grounded in the user's data.
- Rule-based target adjustment with a model-written explanation; insight callouts.

## Phase 9: Synthesis ✅

- Home gauge from real data: energy in from meals; energy out = BMR + activity + training
  estimate (formula documented in `docs/ARCHITECTURE.md`). Readiness. Progress milestone photos.

## Phase 10: native polish ✅

- Icon and splash from `Icon.dc.html`, haptics, a rest-over notification (fires with the screen off),
  water reminders, deep links, signed release APK. An ongoing live rest-timer notification is still to do.

## Phase 11: Android widgets ✅

- RemoteViews widgets (chosen over Glance; see ARCHITECTURE) from a SharedPreferences snapshot: Today, Scan plate, Water +250 ml
  (interactive), Quick add (roti, dahi, chai, dal).

## Phase 12: exercise demos ✅

- SVG pull-up figure and tempo bar from Exercise and FormGuide. Video mode never bundles media.
  react-three-fiber mannequin remains a stretch goal (roadmap).

## Phase 13: landing page and portfolio ✅

- `apps/site` from `Landing.dc.html`, responsive to 360 px, real app screens as mockups,
  Motion scroll reveals. Deploy the site and the web demo. README case study.
