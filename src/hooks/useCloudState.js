import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { reportSync } from "../utils/syncStatus";

// localStorage-cached state that syncs to Firestore at users/{uid}/data/{docId}.
//
// The cloud is the source of truth. Rules that keep devices from wiping each
// other's data:
//  1. Nothing is written to the cloud until the first snapshot *from the
//     server* has arrived ("hydrated"). Before this fix, a fresh device would
//     upload its empty local state 0.7s after opening — and if the server
//     hadn't answered yet, that empty value overwrote everyone's data.
//  2. On that first server snapshot the cloud value replaces the local one —
//     unless the cloud copy is missing or empty while this device still has
//     data. Then the device's data is uploaded instead. That recovers data
//     that the old bug emptied in the cloud but that still lives on a device.
//  3. After that, local changes are written (debounced) and remote changes
//     from other devices stream in live.
//  4. The local cache is namespaced per account, so one account's data can
//     never be uploaded into another's.
function isEmptyValue(v) {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

export function useCloudState(storageKey, docId, initialValue, uid) {
  const cacheKey = uid ? `${storageKey}:${uid}` : storageKey;
  // Prefer this account's cache; fall back to the old un-namespaced key once,
  // so data cached before this change still shows while the cloud loads.
  const [value, setValue] = useState(() => loadFromStorage(cacheKey, loadFromStorage(storageKey, initialValue)));

  const valueRef = useRef(value);
  valueRef.current = value;
  const hydrated = useRef(false);
  const skipNextWrite = useRef(false);
  const debounceRef = useRef(null);

  // Cache locally on every change.
  useEffect(() => {
    saveToStorage(cacheKey, value);
  }, [cacheKey, value]);

  // Live subscription to the cloud copy.
  useEffect(() => {
    if (!uid) return;
    hydrated.current = false;
    reportSync(docId, "loading");
    const ref = doc(db, "users", uid, "data", docId);
    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        // Our own write echoing back before the server confirms it.
        if (snap.metadata.hasPendingWrites) return;
        // A cached snapshot isn't proof of what the server holds — wait.
        if (snap.metadata.fromCache && !hydrated.current) return;

        const remote = snap.exists() ? snap.data().value : undefined;
        const localHasData = !isEmptyValue(valueRef.current);
        if (snap.exists() && !(!hydrated.current && isEmptyValue(remote) && localHasData)) {
          skipNextWrite.current = true;
          setValue(remote);
        } else if (!hydrated.current) {
          // Nothing (or nothing useful) in the cloud yet: upload what this
          // device has.
          setDoc(ref, { value: valueRef.current, updatedAt: serverTimestamp() })
            .then(() => reportSync(docId, "synced"))
            .catch((err) => reportSync(docId, "error", err));
        }
        hydrated.current = true;
        reportSync(docId, "synced");
      },
      (err) => {
        console.error(`Firestore sync error (${docId}):`, err);
        reportSync(docId, "error", err);
      }
    );
    return () => {
      unsub();
      hydrated.current = false;
    };
  }, [uid, docId]);

  // Push local changes up — only once we know what the cloud holds.
  useEffect(() => {
    if (!uid || !hydrated.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    reportSync(docId, "saving");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDoc(doc(db, "users", uid, "data", docId), { value, updatedAt: serverTimestamp() })
        .then(() => reportSync(docId, "synced"))
        .catch((err) => {
          console.error(`Firestore write error (${docId}):`, err);
          reportSync(docId, "error", err);
        });
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [value, uid, docId]);

  return [value, setValue];
}
