// ============================================================
// AddProduct.jsx
// Form that lets a connected seller register a new product
// on the blockchain by calling add_product on the contract.
// ============================================================

import React, { useState } from "react";
import { addProduct } from "../utils/contract";

export default function AddProduct({ walletAddress }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState(null); // { type: "success"|"error", message }
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (!name.trim() || !brand.trim()) {
      setStatus({ type: "error", message: "Please fill in all fields." });
      return;
    }

    if (!walletAddress) {
      setStatus({
        type: "error",
        message: "Please connect your Freighter wallet first.",
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      // Call the smart contract
      const productId = await addProduct(walletAddress, name.trim(), brand.trim());

      setStatus({
        type: "success",
        message: `✅ Product registered! Your Product ID is: ${productId}`,
      });

      // Clear the form
      setName("");
      setBrand("");
    } catch (err) {
      setStatus({ type: "error", message: `❌ Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">📦 Register a Product</h2>
      <p className="card-subtitle">
        Add your product to the blockchain. You'll receive a unique Product ID
        to share with buyers.
      </p>

      <form onSubmit={handleSubmit} className="form">
        {/* Product Name */}
        <div className="form-group">
          <label htmlFor="product-name">Product Name</label>
          <input
            id="product-name"
            type="text"
            placeholder="e.g. iPhone 15 Pro"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Brand */}
        <div className="form-group">
          <label htmlFor="product-brand">Brand</label>
          <input
            id="product-brand"
            type="text"
            placeholder="e.g. Apple"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !walletAddress}
        >
          {loading ? "Registering…" : "Register Product"}
        </button>

        {/* Wallet not connected hint */}
        {!walletAddress && (
          <p className="hint-text">Connect your wallet to register products.</p>
        )}
      </form>

      {/* Status message */}
      {status && (
        <div className={`status-box ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
