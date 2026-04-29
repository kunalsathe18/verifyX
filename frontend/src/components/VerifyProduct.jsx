import React, { useState } from "react";
import { getProduct, approveProduct } from "../utils/contract";
import { invalidateCache } from "../utils/indexer";
import { shortenAddress } from "../utils/freighter";

export default function VerifyProduct({ walletAddress }) {
  const [productId,  setProductId]  = useState("");
  const [result,     setResult]     = useState(null);
  const [notFound,   setNotFound]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [approving,  setApproving]  = useState(false);
  const [approveMsg, setApproveMsg] = useState(null); // { type, text }

  // ── Verify ────────────────────────────────────────────────
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
    setApproveMsg(null);

    try {
      const product = await getProduct(id);
      if (product) {
        setResult(product);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Verification error:", err);
      if (err.message?.toLowerCase().includes("not found")) {
        setNotFound(true);
      } else if (
        err.message?.includes("Bad union switch") ||
        err.message?.includes("union") ||
        err.message?.includes("parsing")
      ) {
        setError("Network error. Please try again in a moment.");
      } else {
        setError("Unable to verify product. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Approve ───────────────────────────────────────────────
  async function handleApprove() {
    if (!walletAddress) {
      setApproveMsg({ type: "error", text: "Connect your wallet to approve." });
      return;
    }

    setApproving(true);
    setApproveMsg(null);

    try {
      await approveProduct(walletAddress, result.id);
      invalidateCache();

      // Re-fetch to show updated approval count
      const updated = await getProduct(result.id);
      if (updated) setResult(updated);

      setApproveMsg({ type: "success", text: "✅ Approval submitted on-chain!" });
    } catch (err) {
      console.error("Approve error:", err);
      setApproveMsg({ type: "error", text: err.message });
    } finally {
      setApproving(false);
    }
  }

  function handleReset() {
    setProductId("");
    setResult(null);
    setNotFound(false);
    setError("");
    setApproveMsg(null);
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="card">
      <h2 className="card-title">🔍 Verify a Product</h2>
      <p className="card-subtitle">
        Enter the Product ID to check if this product is genuine.
      </p>

      <form onSubmit={handleVerify} className="form">
        <div className="form-group">
          <label htmlFor="verify-id">Product ID</label>
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

      {/* ── Genuine result ── */}
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
                <td className="result-label">Approvals</td>
                <td className="result-value">
                  <span className="approval-count">
                    {result.approvals?.length ?? 0} / 2
                  </span>
                </td>
              </tr>
              <tr>
                <td className="result-label">Network Status</td>
                <td className="result-value">
                  {result.is_verified ? (
                    <span className="badge-verified">Verified by Network ✅</span>
                  ) : (
                    <span className="badge-pending">Pending Approval ⏳</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Approve button */}
          {!result.is_verified && (
            <div className="approve-section">
              <button
                className="btn btn-approve"
                onClick={handleApprove}
                disabled={approving || !walletAddress}
              >
                {approving ? (
                  <span className="btn-loading">
                    <span className="spinner" /> Approving…
                  </span>
                ) : (
                  "👍 Approve Product"
                )}
              </button>
              {!walletAddress && (
                <p className="hint-text">Connect wallet to approve.</p>
              )}
            </div>
          )}

          {approveMsg && (
            <div className={`status-box ${approveMsg.type}`}>
              {approveMsg.text}
            </div>
          )}

          <button className="btn-reset" onClick={handleReset}>
            Verify another product
          </button>
        </div>
      )}

      {/* ── Not found ── */}
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
