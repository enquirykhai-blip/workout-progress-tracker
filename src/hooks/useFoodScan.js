import { useState } from "react";
import { FOOD_SCAN_WORKER_URL } from "../aiConfig";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.readAsDataURL(file);
  });
}

// Sends a food photo to the Cloudflare Worker proxy (never directly to
// OpenRouter — the API key lives only on the Worker) and returns its
// { label, calories, protein, confidence } estimate, or null on failure.
export function useFoodScan() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  async function scan(file) {
    setError("");
    setScanning(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch(FOOD_SCAN_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Scan failed. Try again.");
      }
      return data;
    } catch (err) {
      setError(err.message || "Something went wrong scanning the photo.");
      return null;
    } finally {
      setScanning(false);
    }
  }

  return { scan, scanning, error, clearError: () => setError("") };
}
