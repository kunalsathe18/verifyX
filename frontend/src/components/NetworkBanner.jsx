import React, { useEffect, useState } from "react";
import { getNetwork } from "@stellar/freighter-api";

// Shows a warning if Freighter is connected to the wrong network.
// verifyX runs on Testnet — mainnet users would waste real XLM.
export default function NetworkBanner() {
  const [wrongNetwork, setWrongNetwork] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        // freighter-api v3: getNetwork() → { network, networkPassphrase, error? }
        const result = await getNetwork();
        const passphrase =
          typeof result === "string"
            ? result
            : result?.networkPassphrase || result?.network || "";

        if (passphrase && !passphrase.includes("Test")) {
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
