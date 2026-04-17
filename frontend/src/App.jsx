// ============================================================
// App.jsx
// Root component – assembles the full verifyX UI.
// Layout: Header → WalletConnect → AddProduct → VerifyProduct
// ============================================================

import React, { useState } from "react";
import WalletConnect from "./components/WalletConnect";
import AddProduct from "./components/AddProduct";
import VerifyProduct from "./components/VerifyProduct";

export default function App() {
  // walletAddress is shared between AddProduct (needs it to sign)
  // and the header display.
  const [walletAddress, setWalletAddress] = useState(null);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🔐</span>
            <span className="logo-text">verifyX</span>
          </div>
          <p className="logo-tagline">Product Authenticity on the Blockchain</p>
          {/* Wallet connect lives in the header */}
          <WalletConnect onConnect={setWalletAddress} />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="main">
        {/* Hero banner */}
        <section className="hero">
          <h1 className="hero-title">
            Is your product <span className="highlight">genuine</span>?
          </h1>
          <p className="hero-subtitle">
            Sellers register products on-chain. Buyers verify authenticity
            instantly — no middlemen, no fakes.
          </p>
        </section>

        {/* Two-column card layout */}
        <div className="cards-grid">
          {/* Left: register */}
          <AddProduct walletAddress={walletAddress} />

          {/* Right: verify */}
          <VerifyProduct />
        </div>

        {/* How it works */}
        <section className="how-it-works">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <p>Seller connects Freighter wallet</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-number">2</span>
              <p>Seller registers product on-chain</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-number">3</span>
              <p>Buyer enters Product ID to verify</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-number">4</span>
              <p>Blockchain confirms genuine ✅ or fake ❌</p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          Built on{" "}
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noreferrer"
          >
            Stellar
          </a>{" "}
          with{" "}
          <a
            href="https://soroban.stellar.org"
            target="_blank"
            rel="noreferrer"
          >
            Soroban
          </a>{" "}
          · verifyX
        </p>
      </footer>
    </div>
  );
}
