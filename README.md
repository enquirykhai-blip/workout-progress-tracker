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

## Data & Sync

Everything is stored in `localStorage` under the `wpt.*` keys, so the app works
fully offline:

- `wpt.sessions.v1` — logged sets per exercise/date
- `wpt.bodyweight.v1` — body weight entries
- `wpt.fridayPicks.v1` — chosen exercises per Jumaat date

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
