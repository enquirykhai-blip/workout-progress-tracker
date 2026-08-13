import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7mmIlKY6euSbw7rKiw-zSwP5VbSBXpzo",
  authDomain: "workout-progress-tracker-d6162.firebaseapp.com",
  projectId: "workout-progress-tracker-d6162",
  storageBucket: "workout-progress-tracker-d6162.firebasestorage.app",
  messagingSenderId: "534698497528",
  appId: "1:534698497528:web:5b07fc501c538ab3f8f20d",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
