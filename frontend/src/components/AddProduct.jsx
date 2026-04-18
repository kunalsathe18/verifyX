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
      const productId = await addProduct(walletAddress, name.trim(), brand.trim());
      setStatus({ type: "success", message: "Product registered successfully!", productId });
      setName("");
      setBrand("");
    } catch (err) {
      setStatus({ type: "error", message: err.message });
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
        </div>
      )}
    </div>
  );
}
