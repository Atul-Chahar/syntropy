# Build plan

Do one phase per Claude Code session. For each phase:

1. Start `claude` in the repo, press **Shift+Tab** until you see plan mode, paste the prompt.
2. Read the plan it proposes. Push back if something is off, then approve.
3. When it finishes, run the app and look at it next to the design file.
4. Commit (`git add -A && git commit -m "phase N: ..."`), then type `/clear` before the next phase.

---

## Phase 0: get the base running

In your terminal (not in Claude yet):

```bash
git clone https://github.com/DuarteSantos8/openGym syntropy
cd syntropy
# copy CLAUDE.md, design/ and docs/ from this kit into this folder
cp .env.example .env
docker compose up -d        # open http://localhost:8080 and check OpenGym works
claude
```

Prompt:

```
Read CLAUDE.md, docs/PRD.md and docs/SCREENS.md, then explore this repo.
Explain in plain language how the frontend, the api and the auth work today, where
workouts and body weight are stored, and how to run the frontend and api without Docker
for fast development. Then write docs/ARCHITECTURE.md with what you found and a short
list of risks for our plan (Capacitor, passkeys in a native WebView, Gemini, widgets).
Do not change any code yet.
```

## Phase 1: design system

```
Build the Syntropy design system from design/tokens.css and the design files.
1. Import design/tokens.css at the app root (copy it into frontend/src/styles/).
2. Create frontend/src/components/sy/ with: GlassCard, PillButton, IconButton, Segmented,
   Stepper, Ring, Gauge (the homeostasis dial from Home.dc.html), MetricNumber (Doto),
   Kicker, TabBar (the floating pill from any tab screen), Orbs, Grain, BottomSheet.
3. Add an icon set as small React components, copying the SVG paths used in the designs.
4. Add a dev-only page at /dev/ui that shows every component in every state.
Match sizes, radii, colours and motion exactly from the design files. Keep everything accessible.
```

## Phase 2: restyle the training screens

```
Restyle the existing OpenGym training screens to match the designs, keeping all current
behaviour and data working:
- Plan: design/screens/Plan.dc.html
- Workout logger: design/screens/Workout.dc.html
- Library: design/screens/Library.dc.html
- Stats: design/screens/Stats.dc.html
Use the components from frontend/src/components/sy. Add the new tab bar
(Home, Train, Scan, Food, Stats) and routes from docs/SCREENS.md. Screens that do not
exist yet can be simple placeholders for now.
```

## Phase 3: sign in and sign up

```
OpenGym already has passkey auth. Rebuild its screens to match Welcome.dc.html,
SignUp.dc.html, Passkey.dc.html and SignIn.dc.html, wiring the idle, verifying and done
states to the real WebAuthn calls and errors (cancelled, not supported, timed out).
After a new account, route to /goal. Add an "email me a sign-in link" recovery flow
behind a feature flag. Explain what I need to configure for passkeys to work on a real
domain and later inside the iOS and Android app.
```

## Phase 4: nutrition data, food log, water, goals

```
Add nutrition to the api and frontend:
1. Data: foods, meals, water and goal as in docs/SCREENS.md, stored like OpenGym's
   per-user JSON state. Add api routes and tests with node --test.
2. Seed data/foods-indian.json with about 150 common Indian foods using per-unit values
   (pc, katori 150 g, cup, plate). Mark every value as an estimate and cite the source
   you used in a comment at the top of the file.
3. Screens: FoodLog.dc.html, QuickAdd.dc.html, Goal.dc.html. The Goal formula is in the
   script block of Goal.dc.html. Use it, but base maintenance calories on the user's
   weight, height, age and activity (Mifflin-St Jeor) instead of the fixed 2650.
4. Home tiles (Fuel left, Water) and the Energy in value read from this data.
```

## Phase 5: Gemini photo analysis

```
Add AI meal scanning:
1. api: POST /api/meals/analyze takes an image (max 1280 px, compressed on the client),
   calls the current Gemini Flash vision model with a strict JSON schema (see
   docs/SCREENS.md), validates the result, matches items to foods-indian.json, and returns
   items with unit, quantity and confidence. Key from GEMINI_API_KEY in .env. Add a
   timeout, one retry, and a clear error for "could not read this plate".
2. api: POST /api/meals/parse-text for Quick add sentences like "2 more roti and a katori
   of dahi", returning the same item shape.
3. Screens: Scan.dc.html (camera with getUserMedia on web, Capacitor Camera later) and
   Meal.dc.html with the "Ate more later?" flow that adds to the same meal and tags
   the extra items.
Nothing is saved until the user taps "Log to lunch".
```

## Phase 6: synthesis, recovery, progress

```
Build Home.dc.html, Recovery.dc.html and Progress.dc.html with real data:
- Energy in from meals, energy out = BMR + activity + training estimate from logged volume.
- Fatigue per muscle from recent sets and time since training (explain the formula you
  choose in docs/ARCHITECTURE.md in simple words).
- Weight trend as an exponential moving average, with 7D, 30D and 90D ranges.
- Training-day carb adjustment note on Home.
```

## Phase 7: exercise demos

```
Build Exercise.dc.html and FormGuide.dc.html.
1. First use the media from the exercise dataset OpenGym already uses (check its licence)
   for the Video mode, looping and muted.
2. Then add the 3D mode with react-three-fiber: a rigged glTF mannequin with one looping
   animation per exercise, camera presets for Side and Front, play/pause and 0.5x speed,
   and the tempo bar with phase cues synced to the animation time. Start with pull-up,
   squat, bench press, deadlift and overhead press. Lazy-load the 3D code so the
   rest of the app stays fast.
```

## Phase 8: mobile app with Capacitor

```
Wrap the frontend with Capacitor for iOS and Android.
Add Camera, Haptics, Preferences and Local Notifications (rest timer, water reminders).
Make passkeys work inside the app shell (associated domains on iOS, Digital Asset Links on
Android) and tell me exactly which files and settings I must fill in myself.
Handle safe areas, the keyboard and the back button on Android.
```

## Phase 9: widgets and live activity

Widgets are native code, so this phase needs Xcode (Mac) for iOS and Android Studio for Android.

```
Add native widgets that read today's summary from shared storage the app writes to
(App Group on iOS, SharedPreferences on Android):
- iOS WidgetKit: small Scan plate, small Water +250 ml (App Intent), medium Today,
  lock screen circular kcal and protein, rectangular water. Live Activity for the rest timer.
- Android Glance widgets with the same content.
Match Widgets.dc.html and Lock.dc.html. Explain each step I need to do in Xcode and
Android Studio.
```

## Phase 10: landing page

```
Build the marketing site from design/screens/Landing.dc.html as a separate Vite page in
/landing (static, fast, no app code). Responsive down to 360 px. Replace the phone
mockups with real screenshots from the running app. Keep the subtle motion: load-in
fade, slow floating phones, marquee of dishes, scroll reveals with a no-JS fallback.
The early-access form posts to /api/waitlist.
```

---

## Tips

- If Claude drifts from the look, point it at the exact design file and ask it to compare
  sizes and colours line by line.
- Ask it to take screenshots with Playwright of each screen and put them next to the design.
- Keep sessions small. One phase, one commit.
- Ask "explain what you just built like I am presenting it to a friend" at the end of each
  phase, so you can explain every part of your project.
