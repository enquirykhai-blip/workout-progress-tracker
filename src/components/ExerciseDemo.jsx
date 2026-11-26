import { useEffect, useMemo, useRef, useState } from "react";
import { DEMOS } from "../data/demos";

// Animated stick-figure demo of an exercise. Each demo (data/demos.js) gives
// two poses — A (start) and B (peak) — as positions for the hip, torso angle,
// hands and feet. Elbows and knees are solved with two-bone IK so limbs keep
// their length while moving. The loop follows the plan's tempo: lift, hold &
// squeeze, then a slower return.

// Segment lengths (viewBox units).
const L = { torso: 36, neck: 4, head: 7, upper: 22, fore: 21, thigh: 27, shin: 27, foot: 8 };
const FRONT = { torso: 34, shoulder: 13, hip: 7 };

// Timeline (seconds): hold A, A→B, hold B (squeeze), B→A (slow), hold.
const T = [0.4, 1.0, 0.8, 1.4, 0.4];
const CYCLE = T.reduce((a, b) => a + b, 0);

const rad = (d) => (d * Math.PI) / 180;
const dir = (deg) => [Math.cos(rad(deg)), Math.sin(rad(deg))];
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const lerp = (a, b, t) => a + (b - a) * t;
const lerpP = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function progressAt(seconds) {
  let t = seconds % CYCLE;
  if ((t -= T[0]) < 0) return 0;
  if (t < T[1]) return ease(t / T[1]);
  if ((t -= T[1]) < T[2]) return 1;
  if ((t -= T[2]) < T[3]) return 1 - ease(t / T[3]);
  return 0;
}

// Two-bone IK: from joint `a`, reach target `t` with bones l1, l2. `sign`
// picks which side the middle joint (elbow/knee) bends to.
function ik(a, t, l1, l2, sign) {
  const dx = t[0] - a[0];
  const dy = t[1] - a[1];
  const d = Math.hypot(dx, dy) || 0.001;
  const dc = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, d));
  const ux = dx / d;
  const uy = dy / d;
  const x = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const joint = [a[0] + ux * x - uy * h * sign, a[1] + uy * x + ux * h * sign];
  const end = [a[0] + ux * dc, a[1] + uy * dc];
  return [joint, end];
}

function solve(demo, p) {
  const A = demo.A;
  const B = demo.B;
  const hip = lerpP(A.hip, B.hip, p);
  const torso = lerp(A.torso, B.torso, p);
  const armScale = lerp(A.armScale ?? 1, B.armScale ?? 1, p);
  const footAngle = lerp(A.footAngle ?? 0, B.footAngle ?? 0, p);
  const hands = [0, 1].map((i) => lerpP(A.hands[i], B.hands[i], p));
  const feet = [0, 1].map((i) => lerpP(A.feet[i], B.feet[i], p));
  const [eN, eF] = demo.elbow ?? [1, 1];
  const [kN, kF] = demo.knee ?? [-1, -1];
  const up = L.upper * armScale;
  const fo = L.fore * armScale;

  if (demo.view === "front") {
    const neck = add(hip, dir(torso), FRONT.torso);
    const head = add(neck, dir(torso), L.neck + L.head);
    const sh = [add(neck, [1, 0], FRONT.shoulder), add(neck, [-1, 0], FRONT.shoulder)];
    const hp = [add(hip, [1, 0], FRONT.hip), add(hip, [-1, 0], FRONT.hip)];
    const arms = [ik(sh[0], hands[0], up, fo, eN), ik(sh[1], hands[1], up, fo, -eN)];
    const legs = [ik(hp[0], feet[0], L.thigh, L.shin, kN), ik(hp[1], feet[1], L.thigh, L.shin, -kN)];
    return { view: "front", hip, neck, head, sh, hp, arms, legs, footAngle };
  }

  const shoulder = add(hip, dir(torso), L.torso);
  const head = add(shoulder, dir(torso + (A.headTilt ?? 0)), L.neck + L.head);
  const arms = [ik(shoulder, hands[0], up, fo, eN), ik(shoulder, hands[1], up, fo, eF)];
  const legs = [ik(hip, feet[0], L.thigh, L.shin, kN), ik(hip, feet[1], L.thigh, L.shin, kF)];
  return { view: "side", hip, shoulder, head, arms, legs, footAngle };
}

const seg = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
const chain = (a, j, e) => `${seg(a, j)}L${e[0].toFixed(1)} ${e[1].toFixed(1)}`;

function Prop({ prop }) {
  if (prop.t === "rect")
    return <rect x={prop.x} y={prop.y} width={prop.w} height={prop.h} rx={prop.r ?? 2} className="demo-prop" />;
  if (prop.t === "line")
    return (
      <line
        x1={prop.x1}
        y1={prop.y1}
        x2={prop.x2}
        y2={prop.y2}
        className="demo-prop-line"
        strokeWidth={prop.w ?? 3}
      />
    );
  return null;
}

function Equipment({ kind, hand, other, angle = 0 }) {
  const [x, y] = hand;
  switch (kind) {
    case "barSide":
      return (
        <g className="demo-equip">
          <circle cx={x} cy={y} r={8} className="demo-plate" />
          <circle cx={x} cy={y} r={2} />
        </g>
      );
    case "barFront": {
      const ly = (y + other[1]) / 2;
      const x1 = Math.min(x, other[0]) - 16;
      const x2 = Math.max(x, other[0]) + 16;
      return (
        <g className="demo-equip">
          <line x1={x1} y1={ly} x2={x2} y2={ly} className="demo-bar" />
          <line x1={x1 + 2} y1={ly - 7} x2={x1 + 2} y2={ly + 7} className="demo-bar thick" />
          <line x1={x2 - 2} y1={ly - 7} x2={x2 - 2} y2={ly + 7} className="demo-bar thick" />
        </g>
      );
    }
    case "dbEnd":
      return (
        <g className="demo-equip">
          <circle cx={x} cy={y} r={5} className="demo-plate" />
        </g>
      );
    case "dbSide": {
      const [dx, dy] = dir(angle);
      const a = [x - dx * 7, y - dy * 7];
      const b = [x + dx * 7, y + dy * 7];
      return (
        <g className="demo-equip">
          <path d={seg(a, b)} className="demo-bar" />
          <circle cx={a[0]} cy={a[1]} r={3.5} />
          <circle cx={b[0]} cy={b[1]} r={3.5} />
        </g>
      );
    }
    case "handle":
      return <circle cx={x} cy={y} r={3} className="demo-equip" />;
    case "vhandle":
      return <path d={`M${x - 5} ${y}L${x + 5} ${y}L${x} ${y + 6}Z`} className="demo-equip" />;
    default:
      return null;
  }
}

function Figure({ demo, p }) {
  const s = solve(demo, p);
  const near = s.arms[0][1];
  const far = s.arms[1][1];
  const footTip = (leg) => add(leg[1], dir(s.footAngle), L.foot);
  const eq = demo.equip;
  const both = demo.equipBoth;

  return (
    <>
      {(demo.props || []).map((prop, i) => (
        <Prop key={i} prop={prop} />
      ))}
      {demo.cable && (
        <>
          <path d={seg(demo.cable, near)} className="demo-cable" />
          {demo.cableBoth && <path d={seg(demo.cable, far)} className="demo-cable" />}
          <circle cx={demo.cable[0]} cy={demo.cable[1]} r={3} className="demo-pulley" />
        </>
      )}
      {demo.footplate && (
        <path
          d={(() => {
            const f = s.legs[0][1];
            const v = dir(demo.footplate);
            return seg(add(f, v, -13), add(f, v, 13));
          })()}
          className="demo-bar thick"
        />
      )}

      {s.view === "side" ? (
        <>
          <g className="demo-far">
            <path d={chain(s.hip, s.legs[1][0], s.legs[1][1]) + `L${footTip(s.legs[1]).join(" ")}`} />
            {!demo.oneArm && <path d={chain(s.shoulder, s.arms[1][0], s.arms[1][1])} />}
          </g>
          {!demo.oneArm && both && <Equipment kind={eq} hand={far} other={near} angle={demo.equipAngle} />}
          <g className="demo-body">
            <path d={seg(s.hip, s.shoulder)} />
            <path d={chain(s.hip, s.legs[0][0], s.legs[0][1]) + `L${footTip(s.legs[0]).join(" ")}`} />
            <circle cx={s.head[0]} cy={s.head[1]} r={L.head} className="demo-head" />
            <path d={chain(s.shoulder, s.arms[0][0], s.arms[0][1])} />
          </g>
          <Equipment kind={eq} hand={near} other={far} angle={demo.equipAngle} />
        </>
      ) : (
        <>
          <g className="demo-body">
            <path d={seg(s.hip, s.neck)} />
            <path d={seg(s.sh[0], s.sh[1])} />
            <path d={seg(s.hp[0], s.hp[1])} />
            <circle cx={s.head[0]} cy={s.head[1]} r={L.head} className="demo-head" />
            {s.legs.map((leg, i) => (
              <path key={`l${i}`} d={chain(s.hp[i], leg[0], leg[1])} />
            ))}
            {s.arms.map((arm, i) =>
              demo.oneArm && i === 1 && demo.restHand ? null : (
                <path key={`a${i}`} d={chain(s.sh[i], arm[0], arm[1])} />
              )
            )}
          </g>
          {eq === "barFront" ? (
            <Equipment kind={eq} hand={near} other={far} />
          ) : (
            <>
              <Equipment kind={eq} hand={near} other={far} angle={demo.equipAngle} />
              {!demo.oneArm && <Equipment kind={eq} hand={far} other={near} angle={demo.equipAngle} />}
            </>
          )}
        </>
      )}
    </>
  );
}

// Tight viewBox around everything the demo ever draws (both poses and the
// midpoint, plus props and the cable anchor), padded and stretched to the
// stage's aspect ratio so every exercise fills its frame.
function fitViewBox(demo, aspect = 128 / 112) {
  const pts = [];
  for (const p of [0, 0.5, 1]) {
    const s = solve(demo, p);
    const r = L.head;
    pts.push([s.head[0] - r, s.head[1] - r], [s.head[0] + r, s.head[1] + r]);
    s.arms.forEach(([j, e]) => pts.push(j, [e[0] - 8, e[1] - 8], [e[0] + 8, e[1] + 8]));
    s.legs.forEach(([j, e]) => pts.push(j, e, add(e, dir(s.footAngle), L.foot)));
    pts.push(s.hip);
  }
  if (demo.cable) pts.push(demo.cable);
  (demo.props || []).forEach((pr) => {
    if (pr.t === "rect") pts.push([pr.x, pr.y], [pr.x + pr.w, pr.y + pr.h]);
    if (pr.t === "line") pts.push([pr.x1, pr.y1], [pr.x2, pr.y2]);
  });
  pts.push([pts[0][0], 110]); // keep the floor in frame
  let minX = Math.min(...pts.map((q) => q[0])) - 8;
  let maxX = Math.max(...pts.map((q) => q[0])) + 8;
  let minY = Math.min(...pts.map((q) => q[1])) - 6;
  let maxY = 114;
  let w = maxX - minX;
  let h = maxY - minY;
  if (w / h < aspect) {
    const nw = h * aspect;
    minX -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / aspect;
    minY -= nh - h;
    h = nh;
  }
  return { box: `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`, minX, maxX: minX + w };
}

function usePrefersReducedMotion() {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  return reduced;
}

export default function ExerciseDemo({ exerciseId, progress }) {
  const demo = DEMOS[exerciseId];
  const reduced = usePrefersReducedMotion();
  const [p, setP] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!demo || progress != null || reduced) return;
    const t0 = performance.now();
    const loop = (now) => {
      if (!document.hidden) setP(progressAt((now - t0) / 1000));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [demo, progress, reduced]);

  const fit = useMemo(() => (demo ? fitViewBox(demo) : null), [demo]);
  if (!demo) return null;
  const shown = progress ?? (reduced ? 1 : p);

  return (
    <svg
      className="demo-svg"
      viewBox={fit.box}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Demo: ${demo.label || exerciseId}`}
    >
      <line x1={fit.minX + 4} y1="110" x2={fit.maxX - 4} y2="110" className="demo-floor" />
      <Figure demo={demo} p={shown} />
    </svg>
  );
}
