import { useEffect, useState } from "react";

// Tiny shared store for cloud-sync status, so Settings can show whether this
// device is actually in sync. Each synced doc reports one of:
//   loading | saving | synced | error
const statuses = {};
let lastError = null;
const listeners = new Set();

export function reportSync(docId, status, err) {
  statuses[docId] = status;
  if (status === "error") lastError = err?.code || err?.message || "unknown error";
  if (status === "synced" && !Object.values(statuses).includes("error")) lastError = null;
  listeners.forEach((fn) => fn());
}

function summarize() {
  const all = Object.values(statuses);
  if (!all.length) return { state: "loading" };
  if (all.includes("error")) return { state: "error", detail: lastError };
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { state: "offline" };
  if (all.includes("loading")) return { state: "loading" };
  if (all.includes("saving")) return { state: "saving" };
  return { state: "synced" };
}

export function useSyncStatus() {
  const [status, setStatus] = useState(summarize);
  useEffect(() => {
    const update = () => setStatus(summarize());
    listeners.add(update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    return () => {
      listeners.delete(update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return status;
}
