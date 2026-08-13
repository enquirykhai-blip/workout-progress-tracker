// Firebase app initialization — modular (v9+) SDK.
// Config lives in ./firebase-config.js; this file just initializes the app
// and exports the `auth` and `db` instances everything else imports.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
