# Design gaps

Pages and states the Claude Design boards do not cover. Each entry is purpose and content only.

**Status (1.0.0):** built — 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12 (history), 14, 15, 16, 17, 19, 20, 21, 24, 25, 26.
Still open — 11 coach intake and 13 plan proposal review (pipeline exists, screens not wired), 18 a dedicated
exercise detail page, 22 notifications inbox, 23 voice states (voice uses the keyboard's dictation today),
27 is done on the landing page.
Claude designs these in the same system (tokens and existing primitives), shows a 390 x 844
screenshot, and wires real data after approval. The phase column says when each is needed.

## Core

| # | Page | Purpose and content | Phase |
| --- | --- | --- | --- |
| 1 | Body profile | Height, weight, age, sex, activity level, optional body fat, units. Feeds Goal and energy maths. | 4 |
| 2 | App unlock | Biometric unlock when the app opens or resumes. May reuse the SignIn states. | 4 |
| 3 | Workout summary | After Finish: duration, volume, sets, personal records, notes, AI debrief. | 5 |
| 4 | Routine builder | Create or edit a routine: exercises, sets, reps, weight, rest, supersets, progression rule. | 5 |
| 5 | Exercise picker | Add or swap an exercise in a routine or workout. Likely Library in picker mode. | 5 |
| 6 | Weigh-in entry | Weight, date, optional progress photo. | 5 |
| 7 | Meal detail / edit | A logged meal's items, change quantities, delete an item or the meal, change slot and time, photo. | 6 |
| 8 | Food search and custom food | Search the food table, "My foods", create a food with per-unit macros. | 6 |
| 9 | AI settings | Paste the Gemini key, pick models, test the connection, what data leaves the phone, today's usage and cap. | 7 |
| 10 | Scan capture states | Camera permission request or denied, live viewfinder with shutter, analysing, "could not read this plate", gallery import. | 7 |
| 11 | Coach intake | One question per step: goal, experience, days per week, session length, equipment, limitations. | 8 |
| 12 | Coach chat history and voice chat | The list of past threads behind the history button; the voice-chat state behind the quick action. (Intro and chat are designed: `Coach.dc.html`, `Chat.dc.html`.) | 8 |
| 13 | Plan proposal review | Proposed changes per routine, a reason for each, apply or refine. | 8 |
| 14 | Weekly check-in | Weight trend, food and training adherence, suggested targets with the reason, accept or keep. | 8 |
| 15 | Settings / Profile | Profile, units, rest timer defaults, reminders, water glass size and target, AI settings, app lock, backup/export/import, about and licence. | 3 |

## Later

| # | Page | Purpose and content | Phase |
| --- | --- | --- | --- |
| 16 | Food history | Move between days; calendar of past food logs. | 6 |
| 17 | Workout history and session detail | Past sessions; one session's sets. | 5 |
| 18 | Exercise detail | History, PRs, e1RM trend, notes, instructions, outside a workout. | 5 |
| 19 | Create custom exercise | Name, muscles, equipment. | 5 |
| 20 | Recovery muscle detail | Recent sets for the muscle, fatigue level, time until ready. | 9 |
| 21 | Milestone photo viewer | Full photo; compare two dates. | 9 |
| 22 | Notifications / insights inbox | Coach insights and reminders behind the Home bell. | 8 |
| 23 | Voice input states | Listening, transcribing, parsed result in Quick add. | 7 |
| 24 | Sheets and menus | Meal slot picker; routine, exercise and session options; rest timer settings. | 5, 6 |
| 25 | Empty, loading and offline states | First run for Home, Food, Plan, Stats and Progress; skeletons; toasts. | 2 onward |
| 26 | Android widgets and notification | Glance widget sizes; the rest-timer ongoing notification. | 10, 11 |
| 27 | Landing mobile and tablet | The board is fixed at 1440 px. | 13 |

## New primitives these pages need

Switch, ChatBubble, Composer, Calendar, ListRow, EmptyState, Skeleton, Toast. They are derived
from existing primitives (Segmented, GlassCard, InsightCallout, the QuickAdd input) and flagged
for review when first used.
