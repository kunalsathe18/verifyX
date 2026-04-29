import React, { useState, useEffect } from "react";
import WalletConnect from "./components/WalletConnect";
import AddProduct from "./components/AddProduct";
import VerifyProduct from "./components/VerifyProduct";
import NetworkBanner from "./components/NetworkBanner";
import TransactionHistory from "./components/TransactionHistory";
import Dashboard from "./components/Dashboard";
import AuthPage from "./components/AuthPage";
import { getSession, signOut } from "./utils/auth";

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [user,          setUser]          = useState(() => getSession());

  // Keep session in sync if another tab signs out
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "verifyX_session") {
        setUser(getSession());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Not logged in → show auth page ──────────────────────
  if (!user) {
    return <AuthPage onAuth={u => setUser(u)} />;
  }

  const isSeller   = user.role === "seller";
  const isCustomer = user.role === "customer";

  function handleSignOut() {
    signOut();
    setUser(null);
    setWalletAddress(null);
  }

  // ── Logged in → show main app ────────────────────────────
  return (
    <div className="app">
      <NetworkBanner />

      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🔐</span>
            <span className="logo-text">verifyX</span>
          </div>
          <p className="logo-tagline">Product Authenticity on the Blockchain</p>

          {/* Right side: user info + wallet */}
          <div className="header-right">
            <div className="user-pill">
              <span className="user-role-badge">
                {isSeller ? "🏭 Seller" : "🛒 Customer"}
              </span>
              <span className="user-name">{user.name}</span>
              <button
                className="btn-signout"
                onClick={handleSignOut}
                title="Sign out"
              >
                ✕
              </button>
            </div>
            <WalletConnect onConnect={setWalletAddress} />
          </div>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero-title">
            Is your product <span className="highlight">genuine</span>?
          </h1>
          <p className="hero-subtitle">
            {isSeller
              ? "Register your products on-chain and share Product IDs with buyers."
              : "Enter a Product ID to instantly verify authenticity on the blockchain."}
          </p>
        </section>

        {/* Dashboard — visible to everyone */}
        <Dashboard />

        <div className="cards-grid">
          {/* Sellers see Register + Verify; Customers see only Verify */}
          {isSeller && <AddProduct walletAddress={walletAddress} />}
          <VerifyProduct walletAddress={walletAddress} />
        </div>

        {/* Transaction history — sellers only */}
        {isSeller && (
          <div className="transaction-history-section">
            <TransactionHistory />
          </div>
        )}

        <section className="how-it-works">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <p>Seller signs up &amp; connects wallet</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-number">2</span>
              <p>Seller registers product on-chain</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-number">3</span>
              <p>Community approves (2 needed)</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-number">4</span>
              <p>Buyer verifies genuine ✅ or fake ❌</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          Built on{" "}
          <a href="https://stellar.org" target="_blank" rel="noreferrer">Stellar</a>
          {" "}with{" "}
          <a href="https://soroban.stellar.org" target="_blank" rel="noreferrer">Soroban</a>
          {" "}· verifyX
        </p>
      </footer>
    </div>
  );
}
