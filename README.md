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

- **Today's Workout** — auto-detects the day and shows that day's exercises with
  fast, thumb-friendly weight/reps logging (numeric keypad, large tap targets).
- **Personal Records** — logging a set that beats your previous best weight/reps
  for that exercise triggers a PR toast with a subtle celebration animation.
- **Progress** — search any exercise to see its full session history in a table
  plus a weight-over-time line chart.
- **Weekly Overview** — a 7-day grid showing which workout days were completed
  vs missed this week, with prev/next week navigation.
- **Jumaat Custom Picker** — a searchable sheet to choose which exercises make
  up Friday's full-body session, editable any time that day.
- **Body Weight Log** — simple date + weight entries with a trend chart.
- **Rest Timer** — auto-starts after logging any set (default 90s, configurable
  in the account menu), with a floating bar showing the countdown, ±15s
  adjustment, and a skip button.
- **Install as an app** — installable on your phone's home screen (PWA), works
  offline for the app shell once visited.
- **Delete a set** — a × next to any already-logged set removes it and
  renumbers the rest, for fixing a mis-log without editing storage by hand.
- **Nutrition** — log calories, protein, carbs, fat, and fiber per entry
  (multiple a day, e.g. per meal), see today's totals against daily targets
  as progress rings (calories/protein) plus a compact macro stat row
  (carbs/fat/fiber), and view calorie/protein trend charts over time.
- **Scan Food Photo** — take/upload a food photo and an AI vision model
  estimates calories, protein, carbs, fat, and fiber, pre-filling the entry
  for you to review and adjust before saving.

## Data & Sync

Everything is stored in `localStorage` under the `wpt.*` keys, so the app works
fully offline:

- `wpt.sessions.v1` — logged sets per exercise/date
- `wpt.bodyweight.v1` — body weight entries
- `wpt.fridayPicks.v1` — chosen exercises per Jumaat date
- `wpt.nutrition.v1` — logged calorie/protein entries
- `wpt.nutritionTargets.v1` — daily calorie/protein goals

Signing in (email/password, via Firebase Auth) also syncs each of these to
Firestore under `users/{uid}/data/{sessions,bodyweight,fridayPicks}`, so the
same account sees the same data on any device. Recommended Firestore security
rules (Firestore console → Rules):

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
reading), and `dailyTotalsSeries` rolls history into per-day totals for the
trend charts. `src/screens/Nutrition.jsx` renders two SVG progress rings for
calories/protein (the two most glanced-at numbers) plus a compact 3-tile
stat row for carbs/fat/fiber, a quick-add form covering all five, a
deletable list of today's entries, editable targets for all five (older
saved targets that predate carbs/fat/fiber fall back to sane defaults —
250g/70g/30g), and calorie/protein trend charts once there's 2+ days of
history. Targets and entries both sync to Firestore the same way as the
rest of the app's data.

## Scan Food Photo (AI)

The app is a static site with no server of its own, and an AI vision API key
can never safely live in client-side code — anyone could open DevTools and
steal it. So this feature routes through a small Cloudflare Worker that holds
the key server-side:

```
phone camera → app (src/hooks/useFoodScan.js)
             → Cloudflare Worker (cloudflare/food-scan-worker.js, holds the
               OpenRouter key as an encrypted secret, never in this repo)
             → OpenRouter → a vision model
             → structured { label, calories, protein, confidence } back to the app
```

- `cloudflare/food-scan-worker.js` — reference copy of the Worker's source.
  The real deploy target is the Cloudflare dashboard, not this repo; paste
  this file's contents into the Worker editor there. Its CORS is locked to
  this app's exact origin, and it caps the accepted image size.
- `src/aiConfig.js` — exports `FOOD_SCAN_WORKER_URL`, the public Worker URL
  (not a secret — replace the placeholder with your deployed Worker's URL).
- `src/hooks/useFoodScan.js` — converts the photo to a data URL, POSTs it to
  the Worker, and surfaces loading/error state.
- `src/screens/Nutrition.jsx` — the "Scan Food Photo" button opens the
  device camera (`capture="environment"`), and a successful scan pre-fills
  the calorie/protein/label fields — it never saves automatically, so you
  always get to review the AI's estimate before it's logged.

To point this at your own Worker: deploy `cloudflare/food-scan-worker.js` to
Cloudflare Workers, set `OPENROUTER_API_KEY` as an encrypted secret in the
Worker's settings (Settings → Variables and Secrets → Secret, never a
plaintext variable), and update `FOOD_SCAN_WORKER_URL` in `src/aiConfig.js`
to the deployed Worker's `*.workers.dev` URL.

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
