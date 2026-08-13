// Minimal, self-contained example of reading and writing a single workout
// entry to Firestore, matching the security rules in README.md:
//
//   match /users/{userId}/data/{docId} {
//     allow read, write: if request.auth != null && request.auth.uid == userId;
//   }
//
// This is a reference for the read/write pattern the app uses elsewhere
// (see src/hooks/useCloudState.js for the real-time version with onSnapshot
// listeners and offline-first localStorage caching — this file is the plain,
// one-shot version for clarity).
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

// Writes a workout entry under the current user's own path:
// /users/{uid}/data/{docId}
//
// Example:
//   await saveWorkoutEntry("today-example", {
//     exercise: "Dumbbell Flat Press",
//     sets: [{ weight: 20, reps: 10 }, { weight: 22, reps: 8 }],
//   });
export async function saveWorkoutEntry(docId, entry) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Must be signed in to save a workout entry.");

  const ref = doc(db, "users", uid, "data", docId);
  await setDoc(ref, {
    value: entry,
    updatedAt: serverTimestamp(),
  });
}

// Reads a workout entry back from the current user's own path.
// Returns null if it doesn't exist yet.
//
// Example:
//   const entry = await getWorkoutEntry("today-example");
//   console.log(entry); // { exercise: "Dumbbell Flat Press", sets: [...] }
export async function getWorkoutEntry(docId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Must be signed in to read a workout entry.");

  const ref = doc(db, "users", uid, "data", docId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().value : null;
}
