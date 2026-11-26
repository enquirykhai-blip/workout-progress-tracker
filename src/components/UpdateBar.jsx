import { useEffect, useState } from "react";

// Shown when a new version of the app has been deployed and downloaded.
// Tapping Update reloads into it; otherwise it applies next time the app is
// fully closed and reopened.
export default function UpdateBar() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const on = () => setAvailable(true);
    window.addEventListener("app:update-available", on);
    return () => window.removeEventListener("app:update-available", on);
  }, []);
  if (!available) return null;
  return (
    <div className="update-bar" role="status">
      <span>New version available</span>
      <button onClick={() => window.__applyUpdate?.()}>Update</button>
    </div>
  );
}
