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
  isFreighterInstalled,
} from "../utils/freighter";
import DisconnectModal from "./DisconnectModal";

const FREIGHTER_DOWNLOAD_URL = "https://www.freighter.app/";

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
      // First check if Freighter is installed
      const installed = await isFreighterInstalled();
      
      if (!installed) {
        setError("Freighter wallet not found");
        setLoading(false);
        return;
      }
      
      // Clear the disconnected flag BEFORE calling connectWallet
      localStorage.removeItem("wallet_manually_disconnected");
      
      // This will use requestAccess which shows the Freighter popup
      const publicKey = await connectWallet();
      setAddress(publicKey);
      onConnect(publicKey);
    } catch (err) {
      console.error("Connection error:", err);
      
      // Check if it's a Freighter not installed error
      if (err.message?.includes("not installed") || err.message?.includes("Freighter wallet is not installed")) {
        setError("Freighter wallet not found");
      } else {
        setError(err.message);
      }
      
      // If connection fails, restore disconnected state
      localStorage.setItem("wallet_manually_disconnected", "true");
    } finally {
      setLoading(false);
    }
  }

  // Redirect to Freighter download page
  function handleInstallFreighter() {
    window.open(FREIGHTER_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
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
            {error && (
              <div style={{ textAlign: 'right' }}>
                <p className="error-text">{error}</p>
                {error.includes("not found") && (
                  <a
                    className="install-freighter-link"
                    onClick={handleInstallFreighter}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleInstallFreighter();
                    }}
                  >
                    Install Freighter →
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
