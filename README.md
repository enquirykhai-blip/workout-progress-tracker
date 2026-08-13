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
same account sees the same data on any device. Firestore config lives in
`src/firebase.js`. Recommended Firestore security rules (Firestore console →
Rules):

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

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

Optimized for phone screens (max content width 560px) but works fine on desktop too.
