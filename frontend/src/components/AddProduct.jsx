import React, { useState, useEffect } from "react";
import { addProduct } from "../utils/contract";

export default function AddProduct({ walletAddress }) {
  const [name, setName]       = useState("");
  const [brand, setBrand]     = useState("");
  const [status, setStatus]   = useState(null); // { type, message, productId? }
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  // Auto-dismiss success message after 12 seconds
  useEffect(() => {
    if (status?.type === "success") {
      const t = setTimeout(() => setStatus(null), 12000);
      return () => clearTimeout(t);
    }
  }, [status]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) {
      setStatus({ type: "error", message: "Please fill in all fields." });
      return;
    }
    if (!walletAddress) {
      setStatus({ type: "error", message: "Connect your Freighter wallet first." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      console.log("🚀 Starting product registration process...");
      const result = await addProduct(walletAddress, name.trim(), brand.trim());
      
      // result can be { productId, txHash } or just a number (productId)
      const productId = typeof result === 'object' ? result.productId : result;
      const txHash = typeof result === 'object' ? result.txHash : null;
      
      console.log("✅ Registration completed:", { productId, txHash });
      
      if (productId) {
        setStatus({ 
          type: "success", 
          message: "Product registered successfully on blockchain!", 
          productId 
        });
        
        // Emit event for transaction history if we have both productId and txHash
        if (productId && txHash && txHash !== "unknown" && !txHash.startsWith("rpc-error")) {
          window.dispatchEvent(
            new CustomEvent("productRegistered", {
              detail: {
                productId,
                txHash,
                name: name.trim(),
                brand: brand.trim(),
                timestamp: Date.now(),
              },
            })
          );
        }
      } else {
        setStatus({ 
          type: "success", 
          message: "Product registered successfully on blockchain!", 
          productId: null 
        });
      }
      
      setName("");
      setBrand("");
      
    } catch (err) {
      console.error("Registration error:", err);
      
      // Filter out technical RPC errors and show user-friendly messages
      let userMessage = "Registration failed. Please try again.";
      
      if (err.message?.includes("User rejected") || 
          err.message?.includes("denied") ||
          err.message?.includes("cancelled")) {
        userMessage = "Transaction was cancelled. Please try again when ready.";
      } else if (err.message?.includes("Transaction failed") ||
                 err.message?.includes("insufficient balance") ||
                 err.message?.includes("authorization")) {
        userMessage = err.message; // These are already user-friendly
      } else if (err.message?.includes("Account not found")) {
        userMessage = "Wallet account not found. Please fund your wallet with testnet XLM first.";
      } else if (err.message?.includes("network") || 
                 err.message?.includes("connection") ||
                 err.message?.includes("timeout")) {
        userMessage = "Network error. Please check your connection and try again.";
      } else if (err.message?.includes("wallet") || 
                 err.message?.includes("Freighter")) {
        userMessage = "Wallet error. Please make sure Freighter is installed and connected.";
      } else if (err.message?.includes("Bad union switch") || 
                 err.message?.includes("union") ||
                 err.message?.includes("parsing") ||
                 err.message?.includes("XDR")) {
        // Don't show technical RPC errors to users
        userMessage = "Network processing error. Your transaction may have succeeded. Please check the verification section.";
      } else if (err.message && !err.message.includes("switch") && !err.message.includes("union")) {
        // Only show non-technical error messages
        userMessage = err.message;
      }
      
      setStatus({ 
        type: "error", 
        message: userMessage
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(id) {
    navigator.clipboard.writeText(String(id)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card">
      <h2 className="card-title">📦 Register a Product</h2>
      <p className="card-subtitle">
        Add your product to the blockchain and receive a unique Product ID to
        share with buyers.
      </p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="product-name">Product Name</label>
          <input
            id="product-name"
            type="text"
            placeholder="e.g. iPhone 15 Pro"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            maxLength={80}
          />
        </div>

        <div className="form-group">
          <label htmlFor="product-brand">Brand</label>
          <input
            id="product-brand"
            type="text"
            placeholder="e.g. Apple"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={loading}
            maxLength={60}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !walletAddress}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" /> Registering…
            </span>
          ) : (
            "Register Product"
          )}
        </button>

        {!walletAddress && (
          <p className="hint-text">Connect your wallet to register products.</p>
        )}
      </form>

      {/* Error */}
      {status?.type === "error" && (
        <div className="status-box error">❌ {status.message}</div>
      )}

      {/* Success — with copyable Product ID */}
      {status?.type === "success" && (
        <div className="status-box success">
          <p>✅ {status.message}</p>
          {status.productId && (
            <>
              <div className="product-id-row">
                <span className="product-id-label">Your Product ID:</span>
                <span className="product-id-value">#{status.productId}</span>
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(status.productId)}
                  title="Copy Product ID"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="product-id-hint">
                Share this ID with buyers so they can verify authenticity.
              </p>
            </>
          )}
          {!status.productId && (
            <p className="product-id-hint">
              Your product was registered! Check the browser console for the transaction hash to verify on Stellar Explorer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
