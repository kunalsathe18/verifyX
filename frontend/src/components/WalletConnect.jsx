// ============================================================
// WalletConnect.jsx
// Handles Freighter wallet connection and displays the
// connected address in the header.
// ============================================================

import React, { useEffect, useState } from "react";
import {
  connectWallet,
  getConnectedAddress,
  shortenAddress,
} from "../utils/freighter";

export default function WalletConnect({ onConnect }) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // On mount, check if the user is already connected
  useEffect(() => {
    (async () => {
      const existing = await getConnectedAddress();
      if (existing) {
        setAddress(existing);
        onConnect(existing);
      }
    })();
  }, []);

  // Called when the user clicks "Connect Wallet"
  async function handleConnect() {
    setLoading(true);
    setError("");
    try {
      const publicKey = await connectWallet();
      setAddress(publicKey);
      onConnect(publicKey); // lift state up to App
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wallet-bar">
      {address ? (
        // Show the connected address
        <div className="wallet-connected">
          <span className="wallet-dot" />
          <span className="wallet-label">Connected:</span>
          <span className="wallet-address" title={address}>
            {shortenAddress(address)}
          </span>
        </div>
      ) : (
        // Show the connect button
        <div className="wallet-disconnected">
          <button
            className="btn btn-outline"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? "Connecting…" : "🔗 Connect Freighter Wallet"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>
      )}
    </div>
  );
}
