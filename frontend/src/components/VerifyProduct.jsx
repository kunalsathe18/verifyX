// ============================================================
// VerifyProduct.jsx
// Lets anyone look up a product by its ID and see whether
// it is genuine (found on-chain) or fake (not found).
// ============================================================

import React, { useState } from "react";
import { getProduct } from "../utils/contract";
import { shortenAddress } from "../utils/freighter";

export default function VerifyProduct() {
  const [productId, setProductId] = useState("");
  const [result, setResult] = useState(null); // product object or null
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(e) {
    e.preventDefault();

    const id = parseInt(productId, 10);
    if (!productId || isNaN(id) || id < 1) {
      setError("Please enter a valid Product ID (a positive number).");
      return;
    }

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError("");

    try {
      // Query the smart contract
      const product = await getProduct(id);

      if (product) {
        setResult(product);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } catch (err) {
      // Contract panics with "Product not found" → treat as fake
      if (err.message?.toLowerCase().includes("not found")) {
        setNotFound(true);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">🔍 Verify a Product</h2>
      <p className="card-subtitle">
        Enter the Product ID printed on your item to check its authenticity.
      </p>

      <form onSubmit={handleVerify} className="form">
        {/* Product ID input */}
        <div className="form-group">
          <label htmlFor="verify-id">Product ID</label>
          <input
            id="verify-id"
            type="number"
            min="1"
            placeholder="e.g. 1"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-secondary"
          disabled={loading}
        >
          {loading ? "Verifying…" : "Verify Product"}
        </button>
      </form>

      {/* Error */}
      {error && <div className="status-box error">{error}</div>}

      {/* Genuine product */}
      {result && (
        <div className="result-card genuine">
          <div className="result-badge genuine-badge">✅ Genuine Product</div>
          <table className="result-table">
            <tbody>
              <tr>
                <td className="result-label">Product ID</td>
                <td className="result-value">#{result.id}</td>
              </tr>
              <tr>
                <td className="result-label">Name</td>
                <td className="result-value">{result.name}</td>
              </tr>
              <tr>
                <td className="result-label">Brand</td>
                <td className="result-value">{result.brand}</td>
              </tr>
              <tr>
                <td className="result-label">Manufacturer</td>
                <td className="result-value address" title={result.manufacturer}>
                  {shortenAddress(result.manufacturer)}
                </td>
              </tr>
              <tr>
                <td className="result-label">Status</td>
                <td className="result-value">
                  <span className="badge-genuine">Genuine ✅</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Fake / not found */}
      {notFound && (
        <div className="result-card fake">
          <div className="result-badge fake-badge">❌ Fake Product</div>
          <p className="fake-message">
            No product with ID <strong>{productId}</strong> was found on the
            blockchain. This product may be counterfeit.
          </p>
        </div>
      )}
    </div>
  );
}
