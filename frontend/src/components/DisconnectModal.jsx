import React from "react";

export default function DisconnectModal({ onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Disconnect Wallet?</h3>
        <p className="modal-text">
          This will disconnect your wallet from this app.
        </p>
        <div className="modal-info">
          <p className="modal-info-title">💡 For complete disconnection:</p>
          <ol className="modal-steps">
            <li>Open Freighter extension</li>
            <li>Go to Settings → Connected Sites</li>
            <li>Remove this site from the list</li>
          </ol>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
