// Workout programs and the weekly schedule, following the "Start Gym" plan.
// Every exercise is 2 sets × 15 reps, both working sets taken to failure
// (warm up lightly before set 1).
//
// PROGRAMS is the library of workouts. DAYS says which program each weekday
// runs by default (null = rest); on any given date the user can swap in a
// different program (or rest) from the Today screen — see planForDate().
//
// Each exercise carries the muscle it targets (`target`) and whether it's a
// compound or isolation movement (`kind`). A few ids are reused from the old
// split (skull-crusher, rope-pushdown, single-arm-row, ohd-tricep-ext) so
// their logged history and PRs carry over.

export const SETS = 2;
export const REPS = "15";
export const VOLUME_LABEL = `${SETS} × ${REPS}`;

function ex(id, name, target, kind) {
  return { id, name, target, kind };
}

// restSeconds is what the rest timer auto-starts with (the low end of the
// plan's range — use +15 on the timer bar to stretch it).
export const PROGRAMS = {
  back: {
    id: "back",
    focus: "Back",
    keyFocus: ["Width (Lats)", "Thickness (Mid Back)", "Upper Back"],
    rest: "2–3 mins",
    restSeconds: 120,
    exercises: [
    ex("wide-lat-pulldown", "Wide Lat Pull Down", "Lats", "Compound"),
    ex("barbell-bent-row", "Barbell Bent Over Row", "Mid Back", "Compound"),
    ex("single-arm-row", "Single Arm DB Row", "Mid Back", "Compound"),
    ex("cable-row", "Cable Row", "Mid Back", "Compound"),
    ex("close-grip-pulldown", "Close Grip Lat Pull Down", "Lats", "Compound"),
    ex("lat-pushdown-rope", "Lat Push Down (Rope)", "Lats", "Isolation"),
    ],
  },
  shoulder: {
    id: "shoulder",
    focus: "Shoulder",
    keyFocus: ["Overall Shoulder Size", "Width (Side Delt)", "Shape & Roundness"],
    rest: "2–3 mins",
    restSeconds: 120,
    exercises: [
    ex("reverse-fly", "Reverse Fly Machine / DB", "Rear Delt", "Isolation"),
    ex("single-arm-rear-delt-ext", "Single Arm Rear Delt Extension", "Rear Delt", "Isolation"),
    ex("heavy-partial-side-raise", "Heavy Partial Side Raises", "Side Delt", "Isolation"),
    ex("single-arm-side-raise", "Single Arm Side Raises (> 90°)", "Side Delt", "Isolation"),
    ex("upright-row-smith", "Upright Row Smith Machine", "Side Delt", "Compound"),
    ex("shoulder-press-machine", "Shoulder Press Machine / Smith / DB", "Front Delt", "Compound"),
    ],
  },
  legs: {
    id: "legs",
    focus: "Legs",
    keyFocus: ["Quadriceps (Front Thigh)", "Hamstrings (Back Thigh)", "Calves"],
    rest: "3–4 mins",
    restSeconds: 180,
    exercises: [
    ex("squat-hack", "Squat / Hack Squat", "Quads", "Compound"),
    ex("leg-press", "Leg Press (Quad Focus)", "Quads", "Compound"),
    ex("split-squat-db", "Split Squat DB – Low", "Quads", "Compound"),
    ex("walking-lunges", "Walking Lunges", "Quads", "Compound"),
    ex("calf-raise", "Calves Raises", "Calves", "Isolation"),
    ],
  },
  bicep: {
    id: "bicep",
    focus: "Bicep + Forearm",
    keyFocus: ["Bicep Size & Peak", "Forearm Strength & Grip"],
    rest: "2–3 mins",
    restSeconds: 120,
    exercises: [
    ex("hammer-curl-db", "Hammer Curl DB", "Bicep", "Compound"),
    ex("spider-curl-ez", "Spider Curl EZ Bar", "Bicep", "Isolation"),
    ex("preacher-curl-db", "Preacher Curl Single Arm DB", "Bicep", "Isolation"),
    ex("reverse-curl-barbell", "Reverse Curl Barbell", "Forearm", "Compound"),
    ex("close-grip-curl-bar", "Close Grip Bicep Curl – Straight Bar", "Bicep", "Compound"),
    ex("forearm-curl-cable", "Forearm Curl Cable", "Forearm", "Isolation"),
    ],
  },
  tricep: {
    id: "tricep",
    focus: "Tricep",
    keyFocus: ["Tricep Size & Thickness", "Overall Arm Strength"],
    rest: "2–3 mins",
    restSeconds: 120,
    exercises: [
    ex("single-arm-pushdown", "Single Arm Push Down – Heavy", "Tricep", "Compound"),
    ex("rope-pushdown", "Rope Push Down Cable – Heavy", "Tricep", "Compound"),
    ex("ohd-tricep-ext", "Tricep DB Extension – Heavy", "Tricep", "Compound"),
    ex("skull-crusher", "Skull Crusher", "Tricep", "Isolation"),
    ex("db-kickback", "DB Tricep Kick Back", "Tricep", "Isolation"),
    ex("dips", "Dips (Badan Tegak)", "Tricep", "Compound"),
    ],
  },
};

export const PROGRAM_LIST = Object.values(PROGRAMS);

export const EXERCISES = PROGRAM_LIST.flatMap((p) => p.exercises);

export const EXERCISE_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// Program id -> [{ exerciseId, sets, repRange }]
export const PROGRAM = Object.fromEntries(
  PROGRAM_LIST.map((p) => [p.id, p.exercises.map((e) => ({ exerciseId: e.id, sets: SETS, repRange: REPS }))])
);

// Number of leading sets shown as warm-up ("W"). 0 = every set is a working set.
export const WARMUP_SETS = 0;

// Shared "Start Gym" guideline, shown on every training day.
export const GUIDELINE = [
  { title: "Warm Up", body: "Ringan sebelum set #1 – pastikan muscle tersebut gerak." },
  { title: "Working Set (Set #1, #2)", body: "Push all out till failure." },
  { title: "Volume", body: "Semua workout 2 sets × 15 reps." },
  { title: "Tempo", body: "Workout slowly, hold 4 saat dan squeeze selama 4 saat sebelum buat rep ke-2." },
  { title: "Rest", body: "2–3 mins antara set." },
];

// Default weekly schedule. programId null = rest day.
export const DAYS = [
  { key: "ahad", label: "Ahad", jsDay: 0, programId: null },
  { key: "isnin", label: "Isnin", jsDay: 1, programId: null },
  { key: "selasa", label: "Selasa", jsDay: 2, programId: "back" },
  { key: "rabu", label: "Rabu", jsDay: 3, programId: "shoulder" },
  { key: "khamis", label: "Khamis", jsDay: 4, programId: null },
  { key: "jumaat", label: "Jumaat", jsDay: 5, programId: "bicep" },
  { key: "sabtu", label: "Sabtu", jsDay: 6, programId: "tricep" },
];

export const DAY_BY_JS_DAY = Object.fromEntries(DAYS.map((d) => [d.jsDay, d]));

// Special override value meaning "make this a rest day".
export const REST = "rest";

// What to train on a given date: the weekday's default program, unless the
// user picked something else for that date. Returns the weekday fields plus
// the chosen program's (type "workout") or type "rest".
//   overrides: { "YYYY-MM-DD": programId | "rest" }
export function planForDate(date, iso, overrides = {}) {
  const day = DAY_BY_JS_DAY[date.getDay()];
  const picked = overrides[iso];
  const programId = picked === undefined ? day.programId : picked === REST ? null : picked;
  const program = programId ? PROGRAMS[programId] : null;
  return {
    ...day,
    defaultProgramId: day.programId,
    programId: program ? program.id : null,
    overridden: picked !== undefined && (program ? program.id : null) !== day.programId,
    type: program ? "workout" : "rest",
    ...(program
      ? { focus: program.focus, keyFocus: program.keyFocus, rest: program.rest, restSeconds: program.restSeconds }
      : {}),
  };
}
