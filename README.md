# Workout Progress Tracker

A mobile-first web app for tracking a 5-day workout split. Built with React + Vite,
charts via Recharts. Data is stored locally in the browser and synced across devices
via Firebase (Firestore + email/password auth) when signed in.

## The Split

| Day | Focus |
|---|---|
| Isnin | Chest & Triceps |
| Selasa | Back & Biceps |
| Rabu | Arms Focus (Biceps & Triceps) |
| Khamis | Shoulders & Core |
| Jumaat | Full Body (weak points — pick your own 5-6 exercises) |
| Sabtu / Ahad | Rest |

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
- **Weekly Overview** — a 7-day grid showing which workout days were completed
  vs missed this week, with prev/next week navigation.
- **Jumaat Custom Picker** — a searchable sheet to choose which exercises make
  up Friday's full-body session, editable any time that day.
- **Rest Timer** — auto-starts after logging any set (default 90s, configurable
  in the account menu), with a floating bar showing the countdown, ±15s
  adjustment, and a skip button.
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
- `wpt.fridayPicks.v1` — chosen exercises per Jumaat date
- `wpt.nutrition.v1` — logged calorie/protein entries
- `wpt.nutritionTargets.v1` — daily calorie/protein goals

Signing in (email/password, via Firebase Auth) also syncs each of these to
Firestore under `users/{uid}/data/{sessions,fridayPicks,nutrition,nutritionTargets}`,
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

`src/hooks/useRestTimer.js` drives a countdown off an absolute end timestamp
(not a decrementing counter), so it stays accurate even if the tab is
backgrounded. `App.jsx` starts it (using the saved default duration) every
time a set is logged, regardless of whether it was a PR. The default duration
(60/90/120/180s) is a per-device preference stored in `localStorage` under
`wpt.restDuration.v1` — deliberately not synced to Firestore, since it's a
device/UI setting rather than workout data. `src/components/RestTimerBar.jsx`
renders the floating bar with ±15s adjustment and skip.

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
