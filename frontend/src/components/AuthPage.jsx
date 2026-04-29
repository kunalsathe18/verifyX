// ============================================================
// AuthPage.jsx  –  Login / Sign Up gate
// ============================================================

import { useState } from "react";
import { signIn, signUp } from "../utils/auth";

export default function AuthPage({ onAuth }) {
  const [mode,     setMode]     = useState("login");   // "login" | "signup"
  const [role,     setRole]     = useState("customer"); // "seller" | "customer"
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function reset() {
    setName(""); setEmail(""); setPassword(""); setError("");
  }

  function switchMode(m) {
    setMode(m);
    reset();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Small artificial delay so the button state is visible
    await new Promise(r => setTimeout(r, 300));

    const result = mode === "signup"
      ? await signUp(name, email, password, role)
      : await signIn(email, password);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Fire event so Dashboard refreshes user count immediately
    if (mode === "signup") {
      window.dispatchEvent(new CustomEvent("userRegistered"));
    }

    onAuth(result.user);
  }

  return (
    <div className="auth-page">
      {/* ── Brand ── */}
      <div className="auth-brand">
        <span className="auth-brand-icon">🔐</span>
        <span className="auth-brand-name">verifyX</span>
        <p className="auth-brand-tagline">Product Authenticity on the Blockchain</p>
      </div>

      {/* ── Card ── */}
      <div className="auth-card">

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login"  ? "active" : ""}`}
            onClick={() => switchMode("login")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => switchMode("signup")}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>

          {/* Name — signup only */}
          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                maxLength={60}
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              autoComplete={mode === "login" ? "email" : "new-email"}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {/* Role selector — signup only */}
          {mode === "signup" && (
            <div className="form-group">
              <label>I am a…</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${role === "seller" ? "active" : ""}`}
                  onClick={() => setRole("seller")}
                  disabled={loading}
                >
                  🏭 Seller
                  <span className="role-desc">Register products on-chain</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === "customer" ? "active" : ""}`}
                  onClick={() => setRole("customer")}
                  disabled={loading}
                >
                  🛒 Customer
                  <span className="role-desc">Verify product authenticity</span>
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="status-box error" role="alert">
              ❌ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                {mode === "signup" ? "Creating account…" : "Signing in…"}
              </span>
            ) : (
              mode === "signup" ? "Create Account" : "Sign In"
            )}
          </button>
        </form>

        {/* Switch mode link */}
        <p className="auth-switch">
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button className="auth-link" onClick={() => switchMode("signup")} type="button">
                Sign Up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button className="auth-link" onClick={() => switchMode("login")} type="button">
                Sign In
              </button>
            </>
          )}
        </p>
      </div>

      {/* ── Footer note ── */}
      <p className="auth-footer-note">
        Built on{" "}
        <a href="https://stellar.org" target="_blank" rel="noreferrer">Stellar</a>
        {" "}·{" "}
        <a href="https://soroban.stellar.org" target="_blank" rel="noreferrer">Soroban</a>
      </p>
    </div>
  );
}
