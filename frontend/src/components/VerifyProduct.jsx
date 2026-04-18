import React, { useState } from "react";
import { getProduct } from "../utils/contract";
import { shortenAddress } from "../utils/freighter";

export default function VerifyProduct() {
  const [productId, setProductId] = useState("");
  const [result, setResult]       = useState(null);
  const [notFound, setNotFound]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleVerify(e) {
    e.preventDefault();

    const id = parseInt(productId, 10);
    if (!productId || isNaN(id) || id < 1) {
      setError("Please enter a valid Product ID.");
      return;
    }

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError("");

    try {
      const product = await getProduct(id);
      if (product) {
        setResult(product);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes("not found")) {
        setNotFound(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setProductId("");
    setResult(null);
    setNotFound(false);
    setError("");
  }

  return (
    <div className="card">
      <h2 className="card-title">🔍 Verify a Product</h2>
      <p className="card-subtitle">
        Enter the Product ID to check if this product is genuine.
      </p>

      <form onSubmit={handleVerify} className="form">
        <div className="form-group">
          <label htmlFor="verify-id">Product ID</label>
          {/* text input avoids mobile number-spinner UI */}
          <input
            id="verify-id"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 1"
            value={productId}
            onChange={(e) => setProductId(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-secondary"
          disabled={loading}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner spinner-dark" /> Verifying…
            </span>
          ) : (
            "Verify Product"
          )}
        </button>
      </form>

      {error && <div className="status-box error">❌ {error}</div>}

      {/* Genuine */}
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
          <button className="btn-reset" onClick={handleReset}>
            Verify another product
          </button>
        </div>
      )}

      {/* Fake */}
      {notFound && (
        <div className="result-card fake">
          <div className="result-badge fake-badge">❌ Not Found</div>
          <p className="fake-message">
            No product with ID <strong>#{productId}</strong> exists on the
            blockchain. This item may be counterfeit.
          </p>
          <button className="btn-reset" onClick={handleReset}>
            Try another ID
          </button>
        </div>
      )}
    </div>
  );
}
