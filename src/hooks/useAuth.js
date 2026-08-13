import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "../firebase";

export function useAuth() {
  // undefined = still checking for an existing session, null = signed out,
  // object = signed in. onAuthStateChanged fires once on mount with whatever
  // session Firebase already has persisted (local or session storage), so
  // returning users skip the login screen automatically.
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // "Remember me" controls how long the session survives:
  //  - browserLocalPersistence: kept across browser restarts (until sign out)
  //  - browserSessionPersistence: cleared when the tab/window is closed
  // setPersistence() must be called before the sign-in call it applies to —
  // it only affects the *next* sign-in, not any already-active session.
  async function signIn(email, password, rememberMe) {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email, password, rememberMe) {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return createUserWithEmailAndPassword(auth, email, password);
  }

  return {
    user,
    loading: user === undefined,
    signIn,
    signUp,
    signOut: () => firebaseSignOut(auth),
  };
}
