// Small, app-wide motion helpers: a tap ripple on every pressable surface and
// a light haptic tick. Both no-op under prefers-reduced-motion / unsupported
// devices.

const RIPPLE_TARGETS = [
  ".btn",
  ".hero-dark-cta",
  ".hero-dark-swap",
  ".exercise-action",
  ".pill-btn",
  ".chip",
  ".picker-option",
  ".set-log-btn",
  ".focus-skip",
  ".focus-adjust",
  ".ex-head",
  ".nav-item",
  ".guide-toggle",
  ".segmented button",
  ".week-nav button",
  ".empty-card",
  ".coach-launch",
  ".coach-chip",
].join(",");

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// One delegated listener: a soft circle grows out from the exact tap point.
// It uses currentColor, so it's dark on light buttons and light on dark ones.
export function initRipple() {
  if (typeof document === "undefined" || reducedMotion()) return;
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0) return;
      const el = e.target.closest(RIPPLE_TARGETS);
      if (!el || el.disabled) return;
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const dot = document.createElement("span");
      dot.className = "ripple";
      dot.setAttribute("aria-hidden", "true");
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX - r.left - size / 2}px`;
      dot.style.top = `${e.clientY - r.top - size / 2}px`;
      el.appendChild(dot);
      const cleanup = () => dot.remove();
      dot.addEventListener("animationend", cleanup, { once: true });
      setTimeout(cleanup, 900);
    },
    { passive: true }
  );
}

// A short vibration tick (Android browsers; iOS Safari ignores it).
export function haptic(ms = 10) {
  if (reducedMotion()) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // unsupported — silent
  }
}
