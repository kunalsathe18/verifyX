import React, { useState, useEffect } from "react";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("verifyX_transactions");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTransactions(parsed);
      } catch (err) {
        console.warn("Could not parse stored transactions:", err);
      }
    }

    // Listen for new transactions
    const handleNewTransaction = (event) => {
      const { productId, txHash, name, brand, timestamp } = event.detail;
      const newTx = {
        productId,
        txHash,
        name,
        brand,
        timestamp: timestamp || Date.now(),
      };

      setTransactions((prev) => {
        const updated = [newTx, ...prev].slice(0, 10); // Keep last 10
        localStorage.setItem("verifyX_transactions", JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener("productRegistered", handleNewTransaction);
    return () => window.removeEventListener("productRegistered", handleNewTransaction);
  }, []);

  function getExplorerLink(txHash) {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function handleClearHistory() {
    if (confirm("Clear all transaction history?")) {
      setTransactions([]);
      localStorage.removeItem("verifyX_transactions");
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="card transaction-history-card">
        <h2 className="card-title">📜 Transaction History</h2>
        <p className="card-subtitle">
          Your registered products will appear here with links to view them on
          Stellar Explorer.
        </p>
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p className="empty-text">No transactions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card transaction-history-card">
      <div className="card-header-row">
        <h2 className="card-title">📜 Transaction History</h2>
        <button className="btn-clear-history" onClick={handleClearHistory}>
          Clear
        </button>
      </div>
      <p className="card-subtitle">
        Recent product registrations with blockchain verification links.
      </p>

      <div className="transaction-list">
        {transactions.map((tx, index) => (
          <div key={`${tx.txHash}-${index}`} className="transaction-item">
            <div className="transaction-header">
              <span className="transaction-product-id">#{tx.productId}</span>
              <span className="transaction-time">{formatTimestamp(tx.timestamp)}</span>
            </div>
            <div className="transaction-details">
              <div className="transaction-product-info">
                <span className="transaction-name">{tx.name}</span>
                <span className="transaction-brand">{tx.brand}</span>
              </div>
            </div>
            <a
              href={getExplorerLink(tx.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="transaction-link"
            >
              <span className="link-icon">🔗</span>
              View on Stellar Explorer
              <span className="external-icon">↗</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
