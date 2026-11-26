// Stick-figure demos for every exercise (rendered by components/ExerciseDemo).
//
// Coordinates are in a 160-wide viewBox with the floor at y=110; side views
// face right. Each demo has two poses — A (start) and B (peak) — giving the
// hip position, torso angle (degrees, -90 = straight up, 0 = pointing right),
// and targets for the [near, far] hands and feet. Elbows/knees are solved by
// IK; `elbow`/`knee` pick which way they bend (side view: elbow +1 = behind,
// knee -1 = forward; front view: -1 = outward).
//
// `cues` are the 3 short "How to" steps shown next to the animation.

const STAND_FEET = [
  [74, 110],
  [68, 110],
];

const FRONT_FEET = [
  [90, 110],
  [70, 110],
];

const pulldown = (equip, label) => ({
  label,
  view: "side",
  equip,
  cable: [88, -20],
  props: [
    { t: "rect", x: 46, y: 86, w: 32, h: 6 },
    { t: "line", x1: 62, y1: 92, x2: 62, y2: 110, w: 3 },
    { t: "rect", x: 76, y: 72, w: 18, h: 5 },
  ],
  elbow: [-1, -1],
  A: {
    hip: [62, 84],
    torso: -96,
    hands: [
      [88, -16],
      [86, -14],
    ],
    feet: [
      [98, 110],
      [94, 110],
    ],
  },
  B: {
    hip: [62, 84],
    torso: -108,
    hands: [
      [70, 40],
      [68, 42],
    ],
    feet: [
      [98, 110],
      [94, 110],
    ],
  },
});

const pushdown = (equip, label) => ({
  label,
  view: "side",
  equip,
  cable: [116, -20],
  oneArm: label === "Single Arm Push Down",
  props: [{ t: "line", x1: 124, y1: -20, x2: 124, y2: 110, w: 4 }],
  A: {
    hip: [64, 58],
    torso: -84,
    hands: [
      [86, 32],
      [84, 34],
    ],
    feet: STAND_FEET,
  },
  B: {
    hip: [64, 58],
    torso: -84,
    hands: [
      [76, 64],
      [74, 64],
    ],
    feet: STAND_FEET,
  },
});

const standingCurl = (equip, label, equipAngle) => ({
  label,
  view: "side",
  equip,
  equipAngle,
  equipBoth: true,
  A: {
    hip: [70, 56],
    torso: -90,
    hands: [
      [72, 62],
      [69, 62],
    ],
    feet: STAND_FEET,
  },
  B: {
    hip: [70, 56],
    torso: -92,
    hands: [
      [88, 26],
      [85, 28],
    ],
    feet: STAND_FEET,
  },
});

const splitSquat = (label, withDb, stride) => ({
  label,
  view: "side",
  equip: withDb ? "dbEnd" : null,
  equipBoth: true,
  knee: [-1, -1],
  A: {
    hip: [70, 58],
    torso: -88,
    hands: [
      [72, 64],
      [69, 64],
    ],
    feet: [
      [70 + stride, 110],
      [70 - stride, 108],
    ],
    footAngle: 0,
  },
  B: {
    hip: [68, 82],
    torso: -86,
    hands: [
      [70, 88],
      [67, 88],
    ],
    feet: [
      [70 + stride, 110],
      [70 - stride, 108],
    ],
  },
});

export const DEMOS = {
  // ---------- Back ----------
  "wide-lat-pulldown": {
    ...pulldown("barSide", "Wide Lat Pull Down"),
    cues: ["Wide grip, wider than shoulders", "Pull the bar to your upper chest, elbows down", "Chest up, let it rise slowly"],
  },
  "close-grip-pulldown": {
    ...pulldown("vhandle", "Close Grip Lat Pull Down"),
    cues: ["Use a V-handle, hands close", "Pull to your chest, elbows tight to your sides", "Squeeze your lats, rise slowly"],
  },
  "barbell-bent-row": {
    label: "Barbell Bent Over Row",
    view: "side",
    equip: "barSide",
    A: {
      hip: [62, 62],
      torso: -26,
      hands: [
        [96, 96],
        [93, 96],
      ],
      feet: [
        [74, 110],
        [70, 110],
      ],
    },
    B: {
      hip: [62, 62],
      torso: -26,
      hands: [
        [80, 66],
        [77, 66],
      ],
      feet: [
        [74, 110],
        [70, 110],
      ],
    },
    cues: ["Hinge to ~45°, back flat", "Pull the bar to your belly, elbows back", "Squeeze your back, lower slowly"],
  },
  "single-arm-row": {
    label: "Single Arm DB Row",
    view: "side",
    equip: "dbEnd",
    props: [
      { t: "rect", x: 96, y: 82, w: 54, h: 6 },
      { t: "line", x1: 104, y1: 88, x2: 104, y2: 110, w: 3 },
      { t: "line", x1: 142, y1: 88, x2: 142, y2: 110, w: 3 },
    ],
    A: {
      hip: [58, 62],
      torso: -18,
      hands: [
        [94, 98],
        [112, 82],
      ],
      feet: [
        [70, 110],
        [56, 110],
      ],
    },
    B: {
      hip: [58, 62],
      torso: -18,
      hands: [
        [76, 70],
        [112, 82],
      ],
      feet: [
        [70, 110],
        [56, 110],
      ],
    },
    cues: ["One hand and knee on the bench", "Row the DB to your hip, elbow tight", "Don't twist, lower slowly"],
  },
  "cable-row": {
    label: "Cable Row",
    view: "side",
    equip: "handle",
    cable: [152, 90],
    props: [
      { t: "rect", x: 26, y: 92, w: 44, h: 6 },
      { t: "rect", x: 108, y: 84, w: 5, h: 24 },
    ],
    knee: [-1, -1],
    A: {
      hip: [50, 90],
      torso: -58,
      hands: [
        [112, 84],
        [110, 84],
      ],
      feet: [
        [104, 100],
        [100, 100],
      ],
    },
    B: {
      hip: [50, 90],
      torso: -96,
      hands: [
        [70, 76],
        [68, 76],
      ],
      feet: [
        [104, 100],
        [100, 100],
      ],
    },
    cues: ["Sit tall, knees slightly bent", "Pull the handle to your belly, chest up", "Squeeze, then reach forward slowly"],
  },
  "lat-pushdown-rope": {
    label: "Lat Push Down (Rope)",
    view: "side",
    equip: "handle",
    cable: [124, -20],
    props: [{ t: "line", x1: 132, y1: -20, x2: 132, y2: 110, w: 4 }],
    A: {
      hip: [60, 58],
      torso: -74,
      hands: [
        [108, -6],
        [106, -4],
      ],
      feet: STAND_FEET,
    },
    B: {
      hip: [60, 58],
      torso: -74,
      hands: [
        [80, 64],
        [78, 64],
      ],
      feet: STAND_FEET,
    },
    cues: ["Keep arms almost straight throughout", "Push the rope to your thighs with your lats", "Return slowly to head height"],
  },

  // ---------- Shoulder ----------
  "reverse-fly": {
    label: "Reverse Fly",
    view: "front",
    equip: "handle",
    elbow: [-1],
    A: {
      hip: [80, 58],
      torso: -90,
      armScale: 0.45,
      hands: [
        [90, 30],
        [70, 30],
      ],
      feet: FRONT_FEET,
    },
    B: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [134, 26],
        [26, 26],
      ],
      feet: FRONT_FEET,
    },
    cues: ["Chest on the pad, soft elbows", "Open your arms out with the rear delts", "Hold 1 second, close slowly"],
  },
  "single-arm-rear-delt-ext": {
    label: "Single Arm Rear Delt Extension",
    view: "front",
    equip: "handle",
    oneArm: true,
    cable: [10, 22],
    elbow: [-1],
    A: {
      hip: [80, 58],
      torso: -90,
      armScale: 0.85,
      hands: [
        [66, 40],
        [66, 62],
      ],
      feet: FRONT_FEET,
    },
    B: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [134, 24],
        [66, 62],
      ],
      feet: FRONT_FEET,
    },
    cues: ["Cable from the opposite side", "Pull across your body and out", "Arm level with shoulder, return slowly"],
  },
  "heavy-partial-side-raise": {
    label: "Heavy Partial Side Raises",
    view: "front",
    equip: "dbEnd",
    elbow: [-1],
    A: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [100, 64],
        [60, 64],
      ],
      feet: FRONT_FEET,
    },
    B: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [124, 44],
        [36, 44],
      ],
      feet: FRONT_FEET,
    },
    cues: ["Heavy DBs, half range of motion", "Raise out to ~45° only", "Control the way down, no swinging"],
  },
  "single-arm-side-raise": {
    label: "Single Arm Side Raises",
    view: "front",
    equip: "dbEnd",
    oneArm: true,
    elbow: [-1],
    A: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [100, 64],
        [64, 62],
      ],
      feet: FRONT_FEET,
    },
    B: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [130, 4],
        [64, 62],
      ],
      feet: FRONT_FEET,
    },
    cues: ["One arm, lean slightly away", "Raise past shoulder height (> 90°)", "Lower slowly, don't rest at the bottom"],
  },
  "upright-row-smith": {
    label: "Upright Row Smith Machine",
    view: "front",
    equip: "barFront",
    elbow: [-1],
    props: [
      { t: "line", x1: 26, y1: -20, x2: 26, y2: 110, w: 3 },
      { t: "line", x1: 134, y1: -20, x2: 134, y2: 110, w: 3 },
    ],
    A: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [88, 64],
        [72, 64],
      ],
      feet: FRONT_FEET,
    },
    B: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [88, 26],
        [72, 26],
      ],
      feet: FRONT_FEET,
    },
    cues: ["Medium-close grip", "Pull the bar to your chest, elbows high", "Lower slowly to your thighs"],
  },
  "shoulder-press-machine": {
    label: "Shoulder Press",
    view: "front",
    equip: "dbSide",
    equipAngle: 90,
    elbow: [-1],
    A: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [106, 10],
        [54, 10],
      ],
      feet: FRONT_FEET,
    },
    B: {
      hip: [80, 58],
      torso: -90,
      hands: [
        [92, -18],
        [68, -18],
      ],
      feet: FRONT_FEET,
    },
    cues: ["Start with hands at ear level", "Press up, don't lock the elbows", "Lower slowly back to ear level"],
  },

  // ---------- Legs ----------
  "squat-hack": {
    label: "Squat / Hack Squat",
    view: "side",
    equip: "barSide",
    elbow: [-1, -1],
    A: {
      hip: [70, 56],
      torso: -86,
      hands: [
        [64, 24],
        [61, 24],
      ],
      feet: STAND_FEET,
    },
    B: {
      hip: [56, 84],
      torso: -56,
      hands: [
        [70, 52],
        [67, 52],
      ],
      feet: STAND_FEET,
    },
    cues: ["Feet shoulder-width apart", "Sit down until thighs are parallel", "Drive through your heels, chest up"],
  },
  "leg-press": {
    label: "Leg Press",
    view: "side",
    footplate: 50,
    knee: [-1, -1],
    props: [{ t: "line", x1: 16, y1: 64, x2: 54, y2: 94, w: 6 }],
    A: {
      hip: [52, 88],
      torso: -146,
      hands: [
        [58, 96],
        [56, 96],
      ],
      feet: [
        [82, 58],
        [80, 60],
      ],
      footAngle: -40,
    },
    B: {
      hip: [52, 88],
      torso: -146,
      hands: [
        [58, 96],
        [56, 96],
      ],
      feet: [
        [102, 44],
        [100, 46],
      ],
      footAngle: -40,
    },
    cues: ["Feet mid-platform, shoulder-width", "Lower until knees reach ~90°", "Press up, don't lock your knees"],
  },
  "split-squat-db": {
    ...splitSquat("Split Squat DB", true, 24),
    cues: ["One foot forward, one back", "Drop low, back knee toward the floor", "Drive up through the front foot"],
  },
  "walking-lunges": {
    ...splitSquat("Walking Lunges", false, 30),
    cues: ["Take a long step forward", "Lower until the back knee nearly touches", "Push off and keep walking"],
  },
  "calf-raise": {
    label: "Calves Raises",
    view: "side",
    props: [{ t: "rect", x: 70, y: 104, w: 34, h: 6 }],
    A: {
      hip: [70, 50],
      torso: -90,
      hands: [
        [72, 56],
        [69, 56],
      ],
      feet: [
        [74, 104],
        [70, 104],
      ],
      footAngle: 0,
    },
    B: {
      hip: [70, 42],
      torso: -90,
      hands: [
        [72, 48],
        [69, 48],
      ],
      feet: [
        [74, 96],
        [70, 96],
      ],
      footAngle: 60,
    },
    cues: ["Balls of your feet on a step", "Rise onto your toes as high as you can", "Hold, then lower until heels stretch"],
  },

  // ---------- Bicep + Forearm ----------
  "hammer-curl-db": {
    ...standingCurl("dbSide", "Hammer Curl DB", -80),
    cues: ["Hold the DBs upright (neutral grip)", "Elbows at your sides, curl to shoulder", "Hold & squeeze, lower slowly"],
  },
  "spider-curl-ez": {
    label: "Spider Curl EZ Bar",
    view: "side",
    equip: "barSide",
    props: [{ t: "line", x1: 40, y1: 108, x2: 98, y2: 54, w: 6 }],
    A: {
      hip: [56, 80],
      torso: -40,
      hands: [
        [86, 98],
        [83, 98],
      ],
      feet: [
        [40, 110],
        [36, 110],
      ],
    },
    B: {
      hip: [56, 80],
      torso: -40,
      hands: [
        [106, 60],
        [103, 60],
      ],
      feet: [
        [40, 110],
        [36, 110],
      ],
    },
    cues: ["Chest on an incline bench", "Arms hang straight down", "Curl up, squeeze at the top"],
  },
  "preacher-curl-db": {
    label: "Preacher Curl Single Arm DB",
    view: "side",
    equip: "dbEnd",
    oneArm: true,
    props: [{ t: "line", x1: 70, y1: 52, x2: 96, y2: 80, w: 7 }],
    knee: [-1, -1],
    A: {
      hip: [58, 84],
      torso: -88,
      hands: [
        [90, 84],
        [62, 70],
      ],
      feet: [
        [86, 110],
        [82, 110],
      ],
    },
    B: {
      hip: [58, 84],
      torso: -88,
      hands: [
        [82, 42],
        [62, 70],
      ],
      feet: [
        [86, 110],
        [82, 110],
      ],
    },
    cues: ["Upper arm flat on the pad", "Curl up, elbow stays on the pad", "Lower slowly to almost straight"],
  },
  "reverse-curl-barbell": {
    ...standingCurl("barSide", "Reverse Curl Barbell"),
    cues: ["Overhand grip (palms down)", "Elbows tight, curl to your chest", "Lower slowly, control your wrists"],
  },
  "close-grip-curl-bar": {
    ...standingCurl("barSide", "Close Grip Bicep Curl"),
    cues: ["Underhand grip, hands close", "Curl to your chest without swinging", "Squeeze, lower slowly"],
  },
  "forearm-curl-cable": {
    label: "Forearm Curl Cable",
    view: "side",
    equip: "handle",
    cable: [116, 110],
    props: [{ t: "rect", x: 40, y: 86, w: 36, h: 6 }],
    knee: [-1, -1],
    A: {
      hip: [58, 84],
      torso: -68,
      hands: [
        [104, 96],
        [101, 96],
      ],
      feet: [
        [92, 110],
        [88, 110],
      ],
    },
    B: {
      hip: [58, 84],
      torso: -68,
      hands: [
        [104, 80],
        [101, 80],
      ],
      feet: [
        [92, 110],
        [88, 110],
      ],
    },
    cues: ["Forearms resting on your thighs", "Curl only at the wrist", "Lower slowly to a full stretch"],
  },

  // ---------- Tricep ----------
  "single-arm-pushdown": {
    ...pushdown("handle", "Single Arm Push Down"),
    cues: ["One arm, elbow pinned to your side", "Push down until your arm is straight", "Squeeze the tricep, rise slowly"],
  },
  "rope-pushdown": {
    ...pushdown("handle", "Rope Push Down Cable"),
    cues: ["Elbows locked at your sides", "Push down, spread the rope at the bottom", "Rise slowly to chest height"],
  },
  "ohd-tricep-ext": {
    label: "Tricep DB Extension",
    view: "side",
    equip: "dbEnd",
    elbow: [1, 1],
    A: {
      hip: [70, 56],
      torso: -90,
      hands: [
        [60, 4],
        [58, 6],
      ],
      feet: STAND_FEET,
    },
    B: {
      hip: [70, 56],
      torso: -90,
      hands: [
        [74, -20],
        [72, -20],
      ],
      feet: STAND_FEET,
    },
    cues: ["DB overhead, elbows pointing up", "Lower the DB behind your head", "Straighten your arms, elbows don't flare"],
  },
  "skull-crusher": {
    label: "Skull Crusher",
    view: "side",
    equip: "barSide",
    headTilt: 0,
    elbow: [-1, -1],
    knee: [1, 1],
    props: [
      { t: "rect", x: 22, y: 80, w: 92, h: 6 },
      { t: "line", x1: 30, y1: 86, x2: 30, y2: 110, w: 3 },
      { t: "line", x1: 106, y1: 86, x2: 106, y2: 110, w: 3 },
    ],
    A: {
      hip: [42, 74],
      torso: 0,
      hands: [
        [92, 64],
        [90, 64],
      ],
      feet: [
        [24, 110],
        [20, 110],
      ],
    },
    B: {
      hip: [42, 74],
      torso: 0,
      hands: [
        [80, 32],
        [78, 32],
      ],
      feet: [
        [24, 110],
        [20, 110],
      ],
    },
    cues: ["Lie back, arms straight up", "Bend at the elbows, bar to your forehead", "Straighten again, elbows fixed"],
  },
  "db-kickback": {
    label: "DB Tricep Kick Back",
    view: "side",
    equip: "dbEnd",
    elbow: [-1, 1],
    props: [
      { t: "rect", x: 96, y: 82, w: 54, h: 6 },
      { t: "line", x1: 104, y1: 88, x2: 104, y2: 110, w: 3 },
      { t: "line", x1: 142, y1: 88, x2: 142, y2: 110, w: 3 },
    ],
    A: {
      hip: [58, 62],
      torso: -18,
      hands: [
        [72, 78],
        [112, 82],
      ],
      feet: [
        [70, 110],
        [56, 110],
      ],
    },
    B: {
      hip: [58, 62],
      torso: -18,
      hands: [
        [50, 62],
        [112, 82],
      ],
      feet: [
        [70, 110],
        [56, 110],
      ],
    },
    cues: ["Hinge over, upper arm along your body", "Extend your arm straight back", "Squeeze, elbow doesn't move"],
  },
  dips: {
    label: "Dips",
    view: "side",
    elbow: [1, 1],
    knee: [1, 1],
    props: [
      { t: "line", x1: 52, y1: 52, x2: 112, y2: 52, w: 5 },
      { t: "line", x1: 104, y1: 52, x2: 104, y2: 110, w: 3 },
    ],
    A: {
      hip: [74, 46],
      torso: -88,
      hands: [
        [78, 52],
        [75, 52],
      ],
      feet: [
        [62, 92],
        [58, 92],
      ],
    },
    B: {
      hip: [72, 70],
      torso: -86,
      hands: [
        [78, 52],
        [75, 52],
      ],
      feet: [
        [54, 100],
        [50, 100],
      ],
    },
    cues: ["Stay upright (tricep focus)", "Lower until elbows reach ~90°", "Press up, elbows tight and back"],
  },
};
