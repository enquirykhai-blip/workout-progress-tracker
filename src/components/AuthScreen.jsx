import { useState } from "react";
import { IconCheck } from "./icons";

// Firebase auth error codes -> friendly copy. Falls back to a generic
// message for anything not covered here (see err.code for the full list).
const ERROR_MESSAGES = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/network-request-failed": "Network error — check your connection.",
};

export default function AuthScreen({ signIn, signUp }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password, rememberMe);
      } else {
        await signUp(email, password, rememberMe);
      }
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen" style={{ paddingTop: "18vh" }}>
      <div className="screen-header" style={{ textAlign: "center" }}>
        <div className="eyebrow">Workout Tracker</div>
        <h1 className="title-xl">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
        <p className="subtitle">
          {mode === "signin" ? "Sign in to sync your progress." : "Sync your progress across devices."}
        </p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field" style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div
          className="remember-me-row"
          onClick={() => setRememberMe((v) => !v)}
          role="checkbox"
          aria-checked={rememberMe}
          tabIndex={0}
        >
          <div className={`checkbox${rememberMe ? " checked" : ""}`}>{rememberMe && <IconCheck />}</div>
          <span>Remember me on this device</span>
        </div>

        {error && (
          <p style={{ color: "var(--accent)", fontSize: 13, marginBottom: 14 }}>{error}</p>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <button
        className="btn btn-ghost btn-block"
        style={{ marginTop: 8 }}
        onClick={() => {
          setError("");
          setMode(mode === "signin" ? "signup" : "signin");
        }}
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
