# Workout Progress Tracker

A mobile-first web app for tracking a 5-day workout split. Built with React + Vite,
charts via Recharts, and all data stored locally in the browser (no backend, no login).

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

## Data

Everything is stored in `localStorage` under the `wpt.*` keys — data lives on
the device and is never sent anywhere:

- `wpt.sessions.v1` — logged sets per exercise/date
- `wpt.bodyweight.v1` — body weight entries
- `wpt.fridayPicks.v1` — chosen exercises per Jumaat date

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

Optimized for phone screens (max content width 560px) but works fine on desktop too.
