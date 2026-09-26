# Coach screens (B09, B10)

The rows below are also in `docs/SCREENS.md` under Training.

| File | Route | Notes |
|---|---|---|
| `Coach.dc.html` | `/coach` | Intro. Large animated orb avatar, "Hello, Atul!" bubble, four suggested questions (each opens the chat with that question), "Start a chat", AI disclaimer. Opened from the Coach card on Plan. |
| `Chat.dc.html` | `/coach/chat?id=` | Greeting with the orb, messages, attached file cards (photo, PDF) with faded borders, formatted coach replies with action chips, "thinking" state, four quick-action cards (Scan plate, Add files, Plan week, Voice chat), message box with mic and send. |

`Plan.dc.html` is included because its Coach card now links to `Coach.dc.html`.

## The orb avatar (build it once as `<CoachOrb size state />`)

- Layers inside a clipped circle: 5 blurred colour blobs (ember, peach, sage, water blue, deep ember) drifting on
  slow loops (9 to 15 s), a rotating conic "swirl" layer (16 s, `mix-blend-mode: screen`), a glass highlight and
  inner shadow, and two capsule eyes that blink every ~5 s and glance around every 12 s.
- The whole orb breathes (scale 1 to 1.035 over 5.5 s) with a soft glow behind it.
- `state="thinking"`: swirl 2.4 s, blobs 3.2 s, eyes squint. Use this while waiting for the AI reply.
- All keyframes are in the `<style>` block of `Chat.dc.html` (`orb-*`). Respect `prefers-reduced-motion`.
- Sizes used: 200 (intro), 60 (chat header), 50 (voice card), 26 (next to each reply).

## Faded border

`.fb` and `.fb-user` classes in `Chat.dc.html`: a 1 px transparent border with a gradient painted in
`border-box` behind a solid `padding-box` fill, so the edge fades from bright at the top left to nothing.

## Build notes (phase 8)

Adapted to Syntropy's phone-only architecture (`docs/ARCHITECTURE.md`): there is no server,
so the chat runs on the phone and data stays in the stores.

1. `CoachOrb` in `packages/ui`, matching the orb exactly, with `idle` and `thinking` states and
   reduced-motion support.
2. `/coach` intro and `/coach/chat?id=` screens matching the boards, using the faded-border
   style for bubbles, file cards and quick-action cards. The Plan coach card links to `/coach`.
3. Chat lives in `@syntropy/ai`: Gemini with the key from the Keystore, a short system prompt,
   and today's context built from the stores through an allowlist (the same idea as OpenGym's
   `payload.js`): meals, macros vs targets, water, readiness, last sessions, goal. Image and PDF
   attachments go as inline data. The coach never states a number that is not in the context.
4. Replies stream token by token. CapacitorHttp cannot stream, so chat uses the WebView's
   `fetch` to `streamGenerateContent`; if that is blocked, fall back to one non-streamed reply.
5. Threads are saved in the coach store (one file per thread). "New chat" starts a thread; the
   history button lists past threads (that list has no board yet, see `docs/DESIGN_GAPS.md`).
6. Action chips in replies (for example "Log 1 scoop whey") call store actions only after the
   user taps them, never automatically.
7. The intro shows the disclaimer "Coach can make mistakes. It is not medical advice."
