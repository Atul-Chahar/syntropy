# Screens

Each row: design file in `design/screens/`, route, what it does, and where its data comes from.
Routes are Next.js static-export paths: runtime ids go in the query string, never in the path.
Pages with no board are listed in `docs/DESIGN_GAPS.md`.

## Navigation

Bottom tab bar (floating glass pill): **Home · Train · [Scan] · Food · Stats**.
Scan is the raised ember button in the middle. Modal flows (scan, review, quick add, form guide, auth) hide the tab bar.

| Tab | Route | Also reachable from it |
|---|---|---|
| Home | `/` | Recovery (readiness tile), Progress (gauge arrow), Food log (fuel and water tiles) |
| Train | `/plan` | Workout, Exercise, Form guide, Library |
| Scan | `/scan` | Review meal, Quick add |
| Food | `/food` | Target physique, Quick add, Review meal |
| Stats | `/stats` | Recovery, Body progress, Records |

Settings (`/settings`) opens from the Home avatar. The AI Coach (`/coach`) opens from the Plan coach card.

## Access

| File | Route | Notes |
|---|---|---|
| `Welcome.dc.html` | `/welcome` | Dot-particle logo animation. "Continue with passkey" goes to Unlock (returning user), "Create an account" to Sign up. |
| `SignUp.dc.html` | `/signup` | Creates the local profile: name, optional email (never sent anywhere). Step 1 of 3. |
| `Passkey.dc.html` | `/signup/lock` | Enrols the biometric app lock (fingerprint, face or device credential). States: idle, verifying (spinning ring + fingerprint scan), done (sage check + details card). Then Body profile, then Target physique. |
| `SignIn.dc.html` | `/unlock` | Biometric unlock with the same three states; falls back to the device PIN or pattern. The board's QR and email-link buttons are not used (no accounts). |

## Nutrition

| File | Route | Notes |
|---|---|---|
| `Goal.dc.html` | `/goal` | Pick physique (Lean & defined, Recomposition, Lean muscle, Maintain) and pace. Computes training and rest day kcal, protein, carbs, fat, water, target weight and weeks. Formula is in the script block of the file. |
| `FoodLog.dc.html` | `/food` | Calorie ring (left vs target), macro bars, water tracker (14 glasses of 250 ml, plus and minus), meals list (breakfast, lunch, snack, dinner) each with a + to Quick add. Lunch shows "+1 roti, +1 dahi later" tag when items were added after the photo. |
| `Scan.dc.html` | `/scan` | Camera view, detection chips on each dish, bottom sheet with total kcal and macros. Mode switch: Library, Photo, Manual (Manual opens Quick add). |
| `Meal.dc.html` | `/meal/review?id=` | Items in pieces or katori (150 g) with steppers. "Ate more later?" chips add +1 roti, +1 katori dahi, +½ rice to the SAME meal and show a "+N added" tag. Totals update live. |
| `QuickAdd.dc.html` | `/meal/add?id=` | Free-text box ("2 more roti and a katori of dahi") parsed by Gemini, voice button, tabs (Frequent, Indian, Recent, My foods), food rows with steppers, sticky summary bar "Add to lunch". |

## Home and widgets

| File | Route | Notes |
|---|---|---|
| `Home.dc.html` | `/` | Homeostasis gauge (energy in vs out, zero at the top, deficit left, surplus right). Range switch Today, 7D, 30D, 90D. Tiles: Readiness, Fuel left, Water. Fuel card with training-adjusted note. |
| `Lock.dc.html` | native | Reference for the rest-timer ongoing notification on Android (phase 10). Lock screen widgets and Live Activity are iOS-only and not built. |
| `Widgets.dc.html` | native | Android Glance widgets (phase 11): Today (kcal and water rings), Scan plate shortcut, Water +250 ml button, Quick add roti, dahi, chai, dal. |

## Training

| File | Route | Notes |
|---|---|---|
| `Plan.dc.html` | `/plan` | Coach card (links to `/coach`), Monday to Sunday strip, selected day routine with CTA (Resume, Review, Preview). |
| `Workout.dc.html` | `/workout` | Rest timer ring, set table (set, previous, kg, reps, RPE, done), up next. Tapping the exercise name opens Exercise. |
| `Exercise.dc.html` | `/workout/exercise?ex=` | Looping form demo card, progression note, weight and reps steppers, RPE chips, "Log set". |
| `FormGuide.dc.html` | `/exercise/guide?ex=` | Full-screen demo: 3D model or Video, Side or Front angle, tempo bar (Pull, Hold, Lower) with moving playhead, cues that change with the phase, play/pause, 0.5x or 1x, common mistakes. |
| `Coach.dc.html` | `/coach` | Coach intro: animated orb avatar, greeting bubble, four suggested questions (each opens the chat with that question), "Start a chat", AI disclaimer. Opened from the Plan coach card. Details in `docs/COACH.md`. |
| `Chat.dc.html` | `/coach/chat?id=` | Coach chat: messages, attached photo and PDF cards, formatted replies with action chips, thinking state, quick actions (Scan plate, Add files, Plan week, Voice chat), composer with mic and send. |
| `Library.dc.html` | `/library` | Search, muscle chips, equipment chips, "Create your own exercise", rows with a small muscle-map thumbnail and "+ Plan". |
| `Stats.dc.html` | `/stats` | Four tiles, 26-week activity dot grid, muscle card with Balance (sets vs 10 to 20 range), Fatigue, Strength (e1RM with sparklines) tabs. Strength rows open the lift's records; a Personal records card opens `/records`. |
| (no board) | `/records` | Personal records: records this month (Doto) with a 12-week strip, the latest records (one row per lift per session, headline record plus chips for the others it broke), and every lift with its e1RM sparkline. |
| (no board) | `/records/exercise?id=` | One lift: e1RM (or most reps) with a session curve, record sessions lit and the best as a dashed guide (3M / 1Y / All); heaviest, session volume, most reps, record sessions; rep maxes (best vs Epley-predicted); record history; ask the coach. |
| `Recovery.dc.html` | `/recovery` | Front and back capsule body map coloured by state (ready, recovering, fatigued, detrained) and muscle rows. |
| `Progress.dc.html` | `/progress` | Weight with exponential moving average line, 7D, 30D, 90D, tiles, private milestone photos. |
| (no board) | `/progress/photo?pose=` | Guided progress photo: 3:4 viewfinder, NO FLEX tag, the three photo rules, front/side/back, self-timer, gallery, day-one overlay. Photos stay on the phone. |
| (no board) | `/progress/compare?pose=&id=` | Then and now: day one against a later photo (slider or side by side), timeline, delete. |

## Brand and marketing

| File | Use |
|---|---|
| `Main.dc.html` | Logo sheet. The mark is two identical halves: ember top (training), sage bottom (nutrition). SVG paths are inside. |
| `Icon.dc.html` | App icon in Ember, Sage and Duo editions (1024 x 1024). |
| `Identity.dc.html` | Palette, type, mark variants including the dot-matrix version for loading states. |
| `Showcase.dc.html` | Portfolio poster. |
| `Landing.dc.html` | Marketing site, 1440 wide. Sections: hero, Indian AI nutrition, target physique, training loop, widgets, privacy, early access. |

## Data shapes (starting point)

```ts
type Unit = 'pc' | 'katori' | 'cup' | 'plate' | 'g' | 'ml';
interface Food { id: string; name: string; cuisine?: 'indian' | 'global'; unit: Unit; unitLabel: string; gramsPerUnit: number;
  kcal: number; protein: number; carbs: number; fat: number; }            // values per ONE unit
interface MealItem { foodId?: string; name: string; qty: number; unit: Unit; kcal: number; protein: number; carbs: number; fat: number;
  confidence?: number; source: 'photo' | 'manual' | 'text'; addedLater: boolean; }
interface Meal { id: string; date: string; slot: 'breakfast' | 'lunch' | 'snack' | 'dinner'; time: string; photoId?: string; items: MealItem[]; }
interface WaterDay { date: string; entriesMl: number[]; targetMl: number; }
interface Goal { type: 'cut' | 'recomp' | 'gain' | 'maintain'; pace: 'gentle' | 'steady' | 'faster'; targetWeightKg?: number;
  kcalTraining: number; kcalRest: number; protein: number; carbs: number; fat: number; waterMl: number; updatedAt: string; }
```

## Gemini meal analysis contract

Request: one compressed JPEG or WebP (max 1280 px) plus the meal slot. Ask for Indian serving units first.

```json
{
  "cuisine": "north_indian",
  "items": [
    { "name": "Roti", "unit": "pc", "quantity": 2, "grams": 80, "kcal": 210, "protein_g": 6, "carbs_g": 36, "fat_g": 5, "confidence": 0.94 },
    { "name": "Dal tadka", "unit": "katori", "quantity": 1, "grams": 150, "kcal": 170, "protein_g": 9, "carbs_g": 22, "fat_g": 5, "confidence": 0.91 }
  ],
  "total_kcal": 380,
  "notes": ["High protein"]
}
```

Validate the JSON in `@syntropy/ai` on the phone, match item names to the local Indian food table when possible
(so steppers can scale by unit), and fall back to a friendly "Could not read this plate, add items manually" state.
