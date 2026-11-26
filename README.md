# Workout Progress Tracker

A mobile-first web app for tracking a 4-day workout split. Built with React + Vite,
charts via Recharts. Data is stored locally in the browser and synced across devices
via Firebase (Firestore + email/password auth) when signed in.

## The Split

| Day | Focus | Rest |
|---|---|---|
| Tuesday | Back | 2–3 mins |
| Wednesday | Shoulder | 2–3 mins |
| Friday | Bicep + Forearm | 2–3 mins |
| Saturday | Tricep | 2–3 mins |
| Sunday / Monday / Thursday | Rest | — |

**Legs** (3–4 mins rest) stays in the program library but isn't on the
default schedule. On any day, **Swap** (or **Train anyway?** on a rest day)
opens a picker to run any program — Back, Shoulder, Legs, Bicep + Forearm,
Tricep — or make it a rest day, for that date only. Swaps show as "Swapped"
on Today and in the Week schedule; picking the weekday's own default clears
the swap.

Every exercise is 2 sets × 15 reps, both working sets taken to failure
(warm up lightly first), with a slow tempo (hold and squeeze 4 seconds
before the next rep). Reps come pre-filled with 15, so only the weight needs
keying in. Each day's screen shows its key
focus, rest range, and this gym guideline; each exercise is tagged with the
muscle it targets and whether it's compound or isolation. The full program
lives in `src/data/exercises.js`.

## Look & Feel

Light, soft-card UI: a pale grey background with white rounded cards and
soft shadows, black pill buttons, and a floating white pill bottom nav
whose dark active pill slides between tabs with a spring; the active tab
swaps to a filled icon with a pop and reveals its label.

- **Today** — "Welcome back" greeting (name editable in the settings menu,
  top right), then one dark hero card with the day's focus, a progress ring
  (exercises done), "Up next: …" and a Start/Continue button that scrolls to
  the next unfinished exercise. Below: Key Focus / Rest tiles, the
  collapsible gym guideline, then the exercises as a compact accordion: each
  is one row (number, name, muscle, set dots) and only the exercise being
  worked on is open. When it's finished it folds to a summary of its logged
  sets and the next one opens on its own. On rest
  days the hero links to the Food tab and a card previews the next workout.
- **Week** — days trained / consistency tiles and a 7-day schedule list
  showing each day's focus and a Done / Missed / Today / Upcoming / Rest pill.
- **Food** — calorie ring with an "Edit targets" button, a 2×2 macro grid,
  meals grouped by type with an "Add food" button, and one trend chart with a
  Calories / Protein toggle.

## Motion

Every pressable surface gets a soft ripple from the tap point
(`src/utils/motion.js`, one delegated listener), plus a press-scale.
Logging a set fills the ✓ box with a spring, draws the check and pulses a
ring; set dots pop. Screens slide in from the side of the tab you tapped,
lists (exercises, schedule, meals, macro tiles) cascade in, progress rings
sweep up from empty, sheets rise with a light spring over a blurred
backdrop, and the PR toast gets a shine. Android phones also get a tiny
haptic tick on tab changes and logged sets. All of it is switched off under
"reduce motion".

## UX Touches

- **Fewer choices** — the rest timer has 4 options (Auto / 60 / 120 / 180s).
- **Less typing** — reps pre-filled with 15, and logging a set copies its
  weight into the next untouched set.
- **A good ending** — finishing the last exercise turns the hero into a
  "Workout complete" summary (sets, kg lifted, PRs) with a small celebration.
- **No blank screens** — a skeleton shows instantly while the saved session
  loads.

## Features

The app has three tabs: **Today** (workout), **Week** (a 7-day overview), and
**Food** (macro tracking) — nutrition is a first-class part of the app, not
an afterthought, alongside the workout split.

- **Today's Workout** — auto-detects the day and shows that day's exercises
  with fast, thumb-friendly weight/reps logging (numeric keypad, large tap
  targets). The header shows a live "X/Y exercises done" count for the day,
  and any exercise whose full set of prescribed sets is logged gets a small
  checkmark badge next to its name — so scanning the list tells you at a
  glance what's left, without reading every row.
- **Personal Records** — logging a set that beats your previous best weight/reps
  for that exercise triggers a PR toast with a subtle celebration animation,
  and the exercise card shows your current best inline.
- **Weekly Overview** — a 7-day schedule showing which workout days were
  completed vs missed, with prev/next week navigation.
- **How-to demos** — every exercise has an animated stick-figure demo (in
  the app's black-and-white style) beside 3 short "How to" steps, shown at
  the top of the open exercise. The loop follows the plan's tempo: lift,
  hold & squeeze, slower return. Close it with ✕ (remembered); "How to"
  brings it back. Poses live in `src/data/demos.js` and are drawn by
  `src/components/ExerciseDemo.jsx` with two-bone IK, so no image files are
  needed and it works offline.
- **Focus Mode (whole-workout flow)** — "▶ Focus Mode" on the Today hero
  runs the entire workout in one full-screen flow: set 1 is counted by the
  Rep Coach and saved on its own a few seconds after "Done!", then rest
  (ring countdown, "Rest. Next up, …", a "Ten seconds" call), then the
  next set starts by itself with a 3-2-1 — through every set and exercise
  to a "Workout complete" summary. The weight is suggested from today's or
  the last session's log, carried set to set, and adjustable with −/+ while
  resting. Skip an exercise, add/cut rest, start early, or turn off
  "Auto-start" to confirm each set. Every set is logged as it finishes, so
  leaving halfway and reopening resumes where you stopped. The screen stays
  awake.
- **Rep Coach (hands-free rep counting)** — "Start set N" in the open
  exercise opens a full-screen counter: "Ready… 3, 2, 1, Go. Lift!", then
  every rep is paced on the tempo (Lift → Hold & squeeze → Lower) with a
  tick at each phase, and the voice calls every phase ("lift… hold,
  squeeze… lower… 2, lift…"; turn off "Call out phases" for numbers only),
  "Two more!" two from the end and "Done!" at the target. Tempo: hold 4s
  (plan), hold 2s, or no hold. Pause, Stop (keeps the count so far), −1/+1
  to correct, and "+ Keep going" to count past the target to failure.
  Finishing fills REPS — and if KG is filled it logs the set, which opens
  the rest timer. The voice is English and prefers a male system voice
  (e.g. Daniel / Aaron on iPhone, "Google UK English Male" / David
  elsewhere), falling back to a lower-pitched English voice; works offline
  and keeps the screen awake.
- **Focus rest timer** — logging a set opens one full-screen timer: a big
  ring countdown, the exercise name, "Next up" (the next set, or the next
  exercise), and −15s / Skip rest / +15s. Minimise it to a floating pill
  (tap to reopen). At zero the phone vibrates, it shows "GO!" and closes on
  its own. The ⏱ button in an exercise opens it manually. Default length is
  "Auto" (2 min, or 3 min for Legs); 60 / 120 / 180s can be picked in the
  account menu.
- **Install as an app** — installable on your phone's home screen (PWA), works
  offline for the app shell once visited.
- **Delete a set** — a × next to any already-logged set removes it and
  renumbers the rest, for fixing a mis-log without editing storage by hand.
- **Rest day** — instead of a workout list, shows a recovery message and a
  "Log Today's Meals" shortcut straight into the Food tab, since macro
  tracking doesn't take a day off.
- **Nutrition (Food tab)** — log calories, protein, carbs, fat, and fiber per
  entry (multiple a day, grouped by meal — Breakfast/Lunch/Dinner/Snack), see
  today's totals against daily targets as a calorie ring plus four macro
  pills, and view calorie/protein trend charts over time.
- **Scan Food or Label, or just describe it** — take/upload a photo of
  either plated food or a packaged item's printed nutrition facts label, or
  skip the camera entirely and type what you ate (e.g. "nasi lemak with 2
  eggs"). An AI model handles all three: for a label it reads the exact
  printed calories/protein/carbs/fat/fiber for one serving; for a food photo
  or a typed description it estimates the same five values. Either way the
  entry is pre-filled for you to review and adjust before saving.
- **Paste macro info** — already have the exact numbers (copied from a food
  package, a nutrition website, or another tracking app)? Paste the text in
  and the app parses out calories/protein/carbs/fat/fiber itself — no AI
  call, no network, just local text matching, since the numbers are already
  exact and there's nothing to estimate.

## Data & Sync

Everything is stored in `localStorage` under the `wpt.*` keys, so the app works
fully offline:

- `wpt.sessions.v1` — logged sets per exercise/date
- `wpt.dayOverrides.v1` — per-date program swaps (`{ date: programId | "rest" }`)
- `wpt.nutrition.v1` — logged calorie/protein entries
- `wpt.nutritionTargets.v1` — daily calorie/protein goals

Signing in (email/password, via Firebase Auth) also syncs each of these to
Firestore under `users/{uid}/data/{sessions,dayOverrides,nutrition,nutritionTargets}`,
so the same account sees the same data on any device. Recommended Firestore
security rules (Firestore console → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/data/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Authentication

Built with the modular Firebase JS SDK (v9+):

- **Config**: `src/firebase-config.js` exports the plain `firebaseConfig`
  object (public client identifiers — access control comes from the
  Firestore rules above, not from hiding this file). `src/firebase.js`
  imports it, calls `initializeApp`, and exports the shared `auth` and `db`
  instances everything else uses.
- **Sign in / sign up**: `src/components/AuthScreen.jsx` — email + password
  form with a "Remember me" checkbox, toggling between sign-in and sign-up
  modes, with friendly messages for common `auth/*` error codes (wrong
  password, user not found, email already in use, invalid email, weak
  password, network error).
- **Remember me**: `src/hooks/useAuth.js` calls `setPersistence()` with
  either `browserLocalPersistence` (checked — session survives closing the
  browser) or `browserSessionPersistence` (unchecked — session ends when the
  tab closes), *before* calling `signInWithEmailAndPassword` /
  `createUserWithEmailAndPassword`, since persistence only applies going
  forward from that call.
- **Session restore**: the same hook subscribes to `onAuthStateChanged` once
  on mount, so a returning user with a persisted session lands straight in
  the app instead of seeing the login screen (`src/App.jsx` shows a blank
  shell while that initial check resolves, then renders `AuthScreen` or the
  signed-in app).
- **Sign out**: the account button in the top-right corner of the app calls
  `signOut(auth)` (wired through `useAuth().signOut`).
- **Firestore read/write example**: `src/firestoreExample.js` has two small,
  standalone functions — `saveWorkoutEntry(docId, entry)` and
  `getWorkoutEntry(docId)` — showing the plain one-shot `setDoc`/`getDoc`
  pattern against `/users/{uid}/data/{docId}`. The app itself uses a fancier
  real-time version of the same pattern in `src/hooks/useCloudState.js`
  (adds `onSnapshot` listeners and an offline-first localStorage cache), but
  `firestoreExample.js` is the plain version to copy from.

## Rest Timer

`src/hooks/useFocusTimer.js` keeps the single rest countdown, driven off an
absolute end timestamp (not a decrementing counter) so it stays accurate
even if the tab is backgrounded. It lives in `App.jsx`, which starts it
every time a set is logged, so it survives switching tabs.
`src/components/FocusTimer.jsx` renders the full-screen timer and the
minimised pill.

`src/hooks/useRestTimer.js` holds the length preference: "Auto" by default
(the program's `restSeconds` from `src/data/exercises.js`) or a fixed
60/120/180s — stored per device in `localStorage` under
`wpt.restDuration.v2`, deliberately not synced to Firestore since it's a
device/UI setting rather than workout data.

## Installing as an App (PWA)

Configured via `vite-plugin-pwa` in `vite.config.js` — generates a web app
manifest and a service worker that precaches the built app shell, so the app
opens (and shows already-synced data) even with no signal; Firebase calls
still need real network. Icons live in `public/` (`pwa-192.png`, `pwa-512.png`,
`pwa-maskable-512.png` for Android/desktop, `apple-touch-icon.png` for iOS).
On mobile, open the deployed URL and use the browser's "Add to Home Screen" /
"Install app" option.

## Nutrition

`src/utils/nutritionOps.js` holds the pure helpers: `totalsForDate` sums same-day
entries — calories, protein, carbs, fat, fiber — (multiple allowed per day —
breakfast, lunch, a snack — unlike body weight, which is naturally one
reading), `dailyTotalsSeries` rolls history into per-day totals for the
trend charts, and `groupEntriesByMealType` buckets a day's entries into
Breakfast/Lunch/Dinner/Snack (in that order, skipping empty meals) with a
per-meal calorie subtotal — entries logged before meal tagging existed fall
back to "Snack". `currentMealType()` guesses which meal a new entry
probably belongs to from the current time of day, so the add-entry form
opens on a sensible default.

`src/screens/Nutrition.jsx` leads with a single large calorie ring showing
kcal left today (or over, once past target) plus four small macro pills —
carbs/protein/fat/fiber, each with its own mini ring — below it. Styling
stays within the app's existing dark, monochrome-plus-one-accent language
(no per-macro or per-meal colors): icon bubbles are neutral gray, and the
single `--accent` color is reused consistently for every progress ring on
the screen. Entries render grouped by meal (still identifiable via a small
emoji per meal type), each in that neutral icon bubble. Adding an entry
(manual or via AI scan) happens in a bottom sheet opened from a floating
"+" button, with a meal-type picker at the top; editing daily targets
(older saved targets that predate carbs/fat/fiber fall back to sane
defaults — 250g/70g/30g) lives in its own sheet behind a "Targets" link on
the ring card, keeping the main screen uncluttered. Calorie/protein trend
charts still appear below once there's 2+ days of history. Targets and
entries both sync to Firestore the same way as the rest of the app's data.

## Scan Food or Label, or Type It (AI)

The app is a static site with no server of its own, and an AI API key can
never safely live in client-side code — anyone could open DevTools and
steal it. So this feature routes through a small Cloudflare Worker that holds
the key server-side:

```
photo or typed text → app (src/hooks/useFoodScan.js)
             → Cloudflare Worker (cloudflare/food-scan-worker.js, holds the
               OpenRouter key as an encrypted secret, never in this repo)
             → OpenRouter → a vision/text model
             → structured { label, calories, protein, carbs, fat, fiber,
               confidence, source } back to the app
```

The Worker accepts either `{ image }` or `{ text }` in the POST body (never
both) and picks the matching prompt:

- **A printed nutrition facts label** on packaging (`image`) — the model
  reads the exact stated calories/protein/carbs/fat/fiber for one serving
  straight off the label text (no guessing), and the response comes back
  with `source: "label"` and `confidence: "high"`.
- **A plain food photo** with no label (`image`) — the model visually
  estimates the same five values for the portion shown, and the response
  comes back with `source: "estimate"` and a confidence that reflects how
  sure it is.
- **A typed description** (`text`, e.g. "nasi lemak with 2 eggs") — no
  photo at all, the model estimates the five values for a typical serving
  of whatever was described. Always `source: "estimate"`, since there's
  nothing exact to read off text.

`src/screens/Nutrition.jsx` uses `source` to show a different note after an
estimate: "Read from the nutrition label — double-check it matches your
serving" for a label read, versus "AI estimate (_confidence_) — review the
numbers below" for a visual or text estimate. Either way, nothing is saved
automatically — you always review the pre-filled numbers before logging.

- `cloudflare/food-scan-worker.js` — reference copy of the Worker's source.
  The real deploy target is the Cloudflare dashboard, not this repo; paste
  this file's contents into the Worker editor there. Its CORS is locked to
  this app's exact origin, and it caps both the accepted image size and the
  typed description length.
- `src/aiConfig.js` — exports `FOOD_SCAN_WORKER_URL`, the public Worker URL
  (not a secret — replace the placeholder with your deployed Worker's URL).
- `src/hooks/useFoodScan.js` — `scan(file)` converts a photo to a data URL
  and POSTs `{ image }`; `estimateFromText(text)` POSTs `{ text }` instead.
  Both share the same loading/error state, since only one runs at a time.
- `src/screens/Nutrition.jsx` — inside the Add Food sheet, the "What did you
  eat?" field doubles as both the entry's label and the text sent to
  "Estimate with AI" (disabled until you type something); "Scan Photo/Label"
  next to it opens a plain `<input type="file" accept="image/*">` for the
  image path instead — deliberately without a `capture` attribute, so the
  device shows its normal picker (camera **or** photo gallery/library)
  rather than forcing the camera open directly. Either one pre-fills the
  label/calorie/protein/carbs/fat/fiber fields for you to review before
  saving.

To point this at your own Worker: deploy `cloudflare/food-scan-worker.js` to
Cloudflare Workers, set `OPENROUTER_API_KEY` as an encrypted secret in the
Worker's settings (Settings → Variables and Secrets → Secret, never a
plaintext variable), and update `FOOD_SCAN_WORKER_URL` in `src/aiConfig.js`
to the deployed Worker's `*.workers.dev` URL.

## Paste Macro Info

Sometimes you already have the exact numbers — copied from a food package's
back-of-box text, a nutrition site, or another tracking app — and there's
nothing to scan or estimate, just numbers to get into the form. `src/utils/
parseMacros.js` exports `parseMacrosFromText(text)`, a small set of regexes
(no AI, no network) that pull calories/protein/carbs/fat/fiber out of free-
form pasted text, matching common English and Malay label wording (Energy/
Tenaga/Kalori, Protein, Carbohydrate/Karbohidrat, Fat/Lemak, Fiber/Serat) and
tolerating things like `<1g`, decimals, and either a colon or a bare space
before the number. It returns only the fields it actually found a number
for, so a partial match doesn't clobber fields the user already filled in
some other way.

In the Add Food sheet, "Or paste macro info from a label or app" reveals a
textarea and a "Fill Fields From Pasted Text" button. A successful parse
fills in whatever fields it found, shows a "Filled X/5 fields — review
before saving" note, and closes the textarea; if nothing matched, it shows
an error note and leaves the textarea open (and any already-filled fields
untouched) so the user can try a different format instead.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

To point the app at your own Firebase project instead: create one at
[console.firebase.google.com](https://console.firebase.google.com), enable
Firestore + the Email/Password sign-in provider under Authentication, then
replace the object in `src/firebase-config.js` with your project's config
(Project settings → General → Your apps) and publish the security rules
above under Firestore Database → Rules.

Optimized for phone screens (max content width 560px) but works fine on desktop too.
