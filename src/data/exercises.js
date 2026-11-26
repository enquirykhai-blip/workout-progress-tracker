// Weekly program, following the "Start Gym" plan: 5 training days
// (Selasa–Sabtu), every exercise 4 sets × 15 reps — set 1 is a light warm-up,
// sets 2-4 are working sets taken to failure.
//
// Each entry carries the muscle it targets (`target`) and whether it's a
// compound or isolation movement (`kind`). A few ids are reused from the old
// split (skull-crusher, rope-pushdown, single-arm-row, ohd-tricep-ext) so
// their logged history and PRs carry over.

const SETS = 4;
const REPS = "15";

function ex(id, name, target, kind) {
  return { id, name, target, kind };
}

const PLAN = {
  selasa: [
    ex("wide-lat-pulldown", "Wide Lat Pull Down", "Lats", "Compound"),
    ex("barbell-bent-row", "Barbell Bent Over Row", "Mid Back", "Compound"),
    ex("single-arm-row", "Single Arm DB Row", "Mid Back", "Compound"),
    ex("cable-row", "Cable Row", "Mid Back", "Compound"),
    ex("close-grip-pulldown", "Close Grip Lat Pull Down", "Lats", "Compound"),
    ex("lat-pushdown-rope", "Lat Push Down (Rope)", "Lats", "Isolation"),
  ],
  rabu: [
    ex("reverse-fly", "Reverse Fly Machine / DB", "Rear Delt", "Isolation"),
    ex("single-arm-rear-delt-ext", "Single Arm Rear Delt Extension", "Rear Delt", "Isolation"),
    ex("heavy-partial-side-raise", "Heavy Partial Side Raises", "Side Delt", "Isolation"),
    ex("single-arm-side-raise", "Single Arm Side Raises (> 90°)", "Side Delt", "Isolation"),
    ex("upright-row-smith", "Upright Row Smith Machine", "Side Delt", "Compound"),
    ex("shoulder-press-machine", "Shoulder Press Machine / Smith / DB", "Front Delt", "Compound"),
  ],
  khamis: [
    ex("squat-hack", "Squat / Hack Squat", "Quads", "Compound"),
    ex("leg-press", "Leg Press (Quad Focus)", "Quads", "Compound"),
    ex("split-squat-db", "Split Squat DB – Low", "Quads", "Compound"),
    ex("walking-lunges", "Walking Lunges", "Quads", "Compound"),
    ex("calf-raise", "Calves Raises", "Calves", "Isolation"),
  ],
  jumaat: [
    ex("hammer-curl-db", "Hammer Curl DB", "Bicep", "Compound"),
    ex("spider-curl-ez", "Spider Curl EZ Bar", "Bicep", "Isolation"),
    ex("preacher-curl-db", "Preacher Curl Single Arm DB", "Bicep", "Isolation"),
    ex("reverse-curl-barbell", "Reverse Curl Barbell", "Forearm", "Compound"),
    ex("close-grip-curl-bar", "Close Grip Bicep Curl – Straight Bar", "Bicep", "Compound"),
    ex("forearm-curl-cable", "Forearm Curl Cable", "Forearm", "Isolation"),
  ],
  sabtu: [
    ex("single-arm-pushdown", "Single Arm Push Down – Heavy", "Tricep", "Compound"),
    ex("rope-pushdown", "Rope Push Down Cable – Heavy", "Tricep", "Compound"),
    ex("ohd-tricep-ext", "Tricep DB Extension – Heavy", "Tricep", "Compound"),
    ex("skull-crusher", "Skull Crusher", "Tricep", "Isolation"),
    ex("db-kickback", "DB Tricep Kick Back", "Tricep", "Isolation"),
    ex("dips", "Dips (Badan Tegak)", "Tricep", "Compound"),
  ],
};

export const EXERCISES = Object.values(PLAN).flat();

export const EXERCISE_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// Day key -> [{ exerciseId, sets, repRange }]
export const PROGRAM = Object.fromEntries(
  Object.entries(PLAN).map(([day, list]) => [
    day,
    list.map((e) => ({ exerciseId: e.id, sets: SETS, repRange: REPS })),
  ])
);

// Set 1 is the warm-up set; the rest are working sets.
export const WARMUP_SETS = 1;

// Shared "Start Gym" guideline, shown on every training day.
export const GUIDELINE = [
  { title: "Warm Up (Set #1)", body: "Ringan – pastikan muscle tersebut gerak." },
  { title: "Working Set (Set #2, #3, #4)", body: "Push all out till failure." },
  { title: "Volume", body: "Semua workout 4 sets × 15 reps." },
  { title: "Tempo", body: "Workout slowly, hold 4 saat dan squeeze selama 4 saat sebelum buat rep ke-2." },
  { title: "Rest", body: "2–3 mins (majority) | 3–4 mins (legs)." },
];

// restSeconds is what the rest timer auto-starts with on that day (the low
// end of the plan's range — use +15 on the timer bar to stretch it).
export const DAYS = [
  { key: "ahad", label: "Ahad", jsDay: 0, type: "rest" },
  { key: "isnin", label: "Isnin", jsDay: 1, type: "rest" },
  {
    key: "selasa",
    label: "Selasa",
    jsDay: 2,
    type: "workout",
    focus: "Back",
    keyFocus: ["Width (Lats)", "Thickness (Mid Back)", "Upper Back"],
    rest: "2–3 mins",
    restSeconds: 120,
  },
  {
    key: "rabu",
    label: "Rabu",
    jsDay: 3,
    type: "workout",
    focus: "Shoulder",
    keyFocus: ["Overall Shoulder Size", "Width (Side Delt)", "Shape & Roundness"],
    rest: "2–3 mins",
    restSeconds: 120,
  },
  {
    key: "khamis",
    label: "Khamis",
    jsDay: 4,
    type: "workout",
    focus: "Legs",
    keyFocus: ["Quadriceps (Front Thigh)", "Hamstrings (Back Thigh)", "Calves"],
    rest: "3–4 mins",
    restSeconds: 180,
  },
  {
    key: "jumaat",
    label: "Jumaat",
    jsDay: 5,
    type: "workout",
    focus: "Bicep + Forearm",
    keyFocus: ["Bicep Size & Peak", "Forearm Strength & Grip"],
    rest: "2–3 mins",
    restSeconds: 120,
  },
  {
    key: "sabtu",
    label: "Sabtu",
    jsDay: 6,
    type: "workout",
    focus: "Tricep",
    keyFocus: ["Tricep Size & Thickness", "Overall Arm Strength"],
    rest: "2–3 mins",
    restSeconds: 120,
  },
];

export const DAY_BY_JS_DAY = Object.fromEntries(DAYS.map((d) => [d.jsDay, d]));
export const DAY_BY_KEY = Object.fromEntries(DAYS.map((d) => [d.key, d]));
