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

async function postToWorker(payload) {
  const res = await fetch(FOOD_SCAN_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Estimate failed. Try again.");
  }
  return data;
}

// Sends a food photo, or a typed food description, to the Cloudflare Worker
// proxy (never directly to OpenRouter — the API key lives only on the
// Worker) and returns its { label, calories, protein, carbs, fat, fiber,
// confidence, source } estimate, or null on failure.
export function useFoodScan() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  async function scan(file) {
    setError("");
    setScanning(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      return await postToWorker({ image: dataUrl });
    } catch (err) {
      setError(err.message || "Something went wrong scanning the photo.");
      return null;
    } finally {
      setScanning(false);
    }
  }

  async function estimateFromText(text) {
    setError("");
    setScanning(true);
    try {
      return await postToWorker({ text });
    } catch (err) {
      setError(err.message || "Something went wrong estimating that.");
      return null;
    } finally {
      setScanning(false);
    }
  }

  return { scan, estimateFromText, scanning, error, clearError: () => setError("") };
}
