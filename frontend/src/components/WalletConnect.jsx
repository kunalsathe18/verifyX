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
import DisconnectModal from "./DisconnectModal";

export default function WalletConnect({ onConnect }) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // On mount, check if the user is already connected (only if not manually disconnected)
  useEffect(() => {
    const isDisconnected = localStorage.getItem("wallet_manually_disconnected");
    
    // If user manually disconnected, don't auto-reconnect
    if (isDisconnected === "true") {
      return;
    }

    // Otherwise, try to get existing connection
    (async () => {
      const existing = await getConnectedAddress();
      if (existing) {
        setAddress(existing);
        onConnect(existing);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called when the user clicks "Connect Wallet"
  async function handleConnect() {
    setLoading(true);
    setError("");
    
    try {
      // Clear the disconnected flag BEFORE calling connectWallet
      localStorage.removeItem("wallet_manually_disconnected");
      
      // This will use requestAccess which shows the Freighter popup
      const publicKey = await connectWallet();
      setAddress(publicKey);
      onConnect(publicKey);
    } catch (err) {
      setError(err.message);
      // If connection fails, restore disconnected state
      localStorage.setItem("wallet_manually_disconnected", "true");
    } finally {
      setLoading(false);
    }
  }

  // Called when the user clicks "Disconnect"
  function handleDisconnect() {
    setShowDisconnectModal(true);
  }

  function confirmDisconnect() {
    // Clear wallet state immediately
    setAddress(null);
    onConnect(null);
    setError("");
    
    // Set flag to prevent auto-reconnect
    localStorage.setItem("wallet_manually_disconnected", "true");
    setShowDisconnectModal(false);
    
    console.log("✅ Wallet disconnected from app.");
  }

  return (
    <>
      {showDisconnectModal && (
        <DisconnectModal
          onClose={() => setShowDisconnectModal(false)}
          onConfirm={confirmDisconnect}
        />
      )}
      
      <div className="wallet-bar">
        {address ? (
          // Show the connected address with disconnect button
          <div className="wallet-connected-wrapper">
            <div className="wallet-connected">
              <span className="wallet-dot" />
              <span className="wallet-label">Connected:</span>
              <span className="wallet-address" title={address}>
                {shortenAddress(address)}
              </span>
            </div>
            <button
              className="btn-disconnect"
              onClick={handleDisconnect}
              title="Disconnect wallet"
            >
              ✕
            </button>
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
    </>
  );
}
