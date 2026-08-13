// Master list of unique exercises. `day` marks the exercise's primary/home day
// (used as a fallback label); actual weekly assignments live in PROGRAM below,
// since a handful of exercises (e.g. Bicep Curl) appear on more than one day.
export const EXERCISES = [
  { id: "flat-press", name: "Dumbbell Flat Press", day: "isnin" },
  { id: "incline-press", name: "Dumbbell Incline Press", day: "isnin" },
  { id: "cable-fly", name: "Cable Chest Fly (Crossover)", day: "isnin" },
  { id: "ohd-tricep-ext", name: "Dumbbell Overhead Tricep Extension", day: "isnin" },
  { id: "rope-pushdown", name: "Cable Rope Tricep Pushdown", day: "isnin" },
  { id: "rope-ohd-ext", name: "Cable Rope Overhead Tricep Extension", day: "isnin" },

  { id: "bent-row", name: "Dumbbell Bent-over Row", day: "selasa" },
  { id: "lat-pulldown", name: "Cable Rope Lat Pulldown", day: "selasa" },
  { id: "single-arm-row", name: "Single-arm Dumbbell Row", day: "selasa" },
  { id: "db-deadlift", name: "Dumbbell Deadlift", day: "selasa" },
  { id: "bicep-curl", name: "Dumbbell Bicep Curl", day: "selasa" },
  { id: "hammer-curl", name: "Cable Rope Hammer Curl", day: "selasa" },

  { id: "concentration-curl", name: "Dumbbell Concentration Curl", day: "rabu" },
  { id: "skull-crusher", name: "Dumbbell Skull Crusher", day: "rabu" },

  { id: "shoulder-press", name: "Dumbbell Shoulder Press", day: "khamis" },
  { id: "lateral-raise", name: "Dumbbell Lateral Raise", day: "khamis" },
  { id: "front-raise", name: "Dumbbell Front Raise", day: "khamis" },
  { id: "face-pull", name: "Cable Rope Face Pull", day: "khamis" },
  { id: "plank", name: "Plank", day: "khamis" },
  { id: "russian-twist", name: "Dumbbell Russian Twist", day: "khamis" },
];

export const EXERCISE_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// Weekly program: which exercises appear on which day, with that day's target
// sets and rep range. Jumaat is intentionally omitted — it's the custom pick day.
export const PROGRAM = {
  isnin: [
    { exerciseId: "flat-press", sets: 4, repRange: "10-12" },
    { exerciseId: "incline-press", sets: 3, repRange: "10-12" },
    { exerciseId: "cable-fly", sets: 3, repRange: "12-15" },
    { exerciseId: "ohd-tricep-ext", sets: 3, repRange: "12-15" },
    { exerciseId: "rope-pushdown", sets: 3, repRange: "15" },
    { exerciseId: "rope-ohd-ext", sets: 3, repRange: "15" },
  ],
  selasa: [
    { exerciseId: "bent-row", sets: 4, repRange: "10-12" },
    { exerciseId: "lat-pulldown", sets: 3, repRange: "12-15" },
    { exerciseId: "single-arm-row", sets: 3, repRange: "10-12 / side" },
    { exerciseId: "db-deadlift", sets: 3, repRange: "10-12" },
    { exerciseId: "bicep-curl", sets: 3, repRange: "12-15" },
    { exerciseId: "hammer-curl", sets: 3, repRange: "15" },
  ],
  rabu: [
    { exerciseId: "bicep-curl", sets: 4, repRange: "10-12" },
    { exerciseId: "hammer-curl", sets: 3, repRange: "12-15" },
    { exerciseId: "concentration-curl", sets: 3, repRange: "12-15" },
    { exerciseId: "ohd-tricep-ext", sets: 4, repRange: "10-12" },
    { exerciseId: "rope-pushdown", sets: 3, repRange: "12-15" },
    { exerciseId: "skull-crusher", sets: 3, repRange: "12-15" },
  ],
  khamis: [
    { exerciseId: "shoulder-press", sets: 4, repRange: "10-12" },
    { exerciseId: "lateral-raise", sets: 3, repRange: "12-15" },
    { exerciseId: "front-raise", sets: 3, repRange: "12-15" },
    { exerciseId: "face-pull", sets: 3, repRange: "15" },
    { exerciseId: "plank", sets: 3, repRange: "45-60s" },
    { exerciseId: "russian-twist", sets: 3, repRange: "20" },
  ],
  jumaat: [],
};

// Falls back to the first program entry that references this exercise, so the
// Jumaat custom picker can show sensible default sets/reps for any exercise.
export function defaultTargetFor(exerciseId) {
  for (const day of Object.keys(PROGRAM)) {
    const entry = PROGRAM[day].find((p) => p.exerciseId === exerciseId);
    if (entry) return entry;
  }
  return { exerciseId, sets: 3, repRange: "10-12" };
}

export const DAYS = [
  { key: "ahad", label: "Ahad", jsDay: 0, type: "rest" },
  { key: "isnin", label: "Isnin", jsDay: 1, type: "workout", focus: "Chest & Triceps" },
  { key: "selasa", label: "Selasa", jsDay: 2, type: "workout", focus: "Back & Biceps" },
  { key: "rabu", label: "Rabu", jsDay: 3, type: "workout", focus: "Arms Focus" },
  { key: "khamis", label: "Khamis", jsDay: 4, type: "workout", focus: "Shoulders & Core" },
  { key: "jumaat", label: "Jumaat", jsDay: 5, type: "custom", focus: "Full Body (Weak Points)" },
  { key: "sabtu", label: "Sabtu", jsDay: 6, type: "rest" },
];

export const DAY_BY_JS_DAY = Object.fromEntries(DAYS.map((d) => [d.jsDay, d]));
