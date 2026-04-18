import React, { useEffect, useState } from "react";
import { getNetworkDetails } from "@stellar/freighter-api";

// Shows a warning if Freighter is connected to the wrong network.
// verifyX runs on Testnet — mainnet users would be talking to a
// different contract and wasting real XLM.
export default function NetworkBanner() {
  const [wrongNetwork, setWrongNetwork] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const details = await getNetworkDetails();
        const network =
          typeof details === "object" ? details?.networkPassphrase || details?.network : details;
        // If it doesn't contain "Test", it's mainnet or something else
        if (network && !network.includes("Test")) {
          setWrongNetwork(true);
        }
      } catch {
        // Freighter not installed or not connected — ignore
      }
    }
    check();
  }, []);

  if (!wrongNetwork) return null;

  return (
    <div className="network-banner">
      ⚠️ Freighter is set to <strong>Mainnet</strong>. Switch to{" "}
      <strong>Testnet</strong> inside the Freighter extension to use verifyX.
    </div>
  );
}
