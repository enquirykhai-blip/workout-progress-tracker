import { useEffect, useRef } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useLocalStorageState } from "./useLocalStorageState";

// localStorage-first state that also syncs to Firestore when a user is signed in.
// Writes are debounced; snapshots with pending (unconfirmed) local writes are
// ignored so our own optimistic update doesn't immediately echo back.
export function useCloudState(storageKey, docId, initialValue, uid) {
  const [value, setValue] = useLocalStorageState(storageKey, initialValue);
  const debounceRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "users", uid, "data", docId);
    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          isRemoteUpdate.current = true;
          setValue(snap.data().value);
        }
      },
      (err) => console.error(`Firestore sync error (${docId}):`, err)
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, docId]);

  useEffect(() => {
    if (!uid) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDoc(doc(db, "users", uid, "data", docId), { value, updatedAt: serverTimestamp() }).catch(
        (err) => console.error(`Firestore write error (${docId}):`, err)
      );
    }, 700);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, uid, docId]);

  return [value, setValue];
}
