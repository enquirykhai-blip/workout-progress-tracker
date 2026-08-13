// Firebase project config — safe to keep in source control.
// These are public client identifiers (not secrets); real access control is
// enforced by Firestore Security Rules, not by hiding this object. Get your
// own values from: Firebase Console > Project settings > General > Your apps.
//
// NOTE: these values are already live and verified against a real Firebase
// project (workout-progress-tracker-d6162) — auth, Firestore read/write, and
// the security rules have all been tested end-to-end. If you want to point
// this app at a different Firebase project instead, replace the object below
// with your own project's config.
export const firebaseConfig = {
  apiKey: "AIzaSyD7mmIlKY6euSbw7rKiw-zSwP5VbSBXpzo",
  authDomain: "workout-progress-tracker-d6162.firebaseapp.com",
  projectId: "workout-progress-tracker-d6162",
  storageBucket: "workout-progress-tracker-d6162.firebasestorage.app",
  messagingSenderId: "534698497528",
  appId: "1:534698497528:web:5b07fc501c538ab3f8f20d",
};
