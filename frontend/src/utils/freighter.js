// ============================================================
// freighter.js  –  @stellar/freighter-api v3
// v3 API changes:
//   getPublicKey()  →  removed
//   getAddress()    →  returns { address, error }
//   requestAccess() →  returns { address, error }
// ============================================================

import {
  isConnected,
  getAddress,
  requestAccess,
} from "@stellar/freighter-api";

// Returns true if Freighter extension is installed
export async function isFreighterInstalled() {
  try {
    const result = await isConnected();
    // v3 returns { isConnected: bool, error? }
    if (typeof result === "object" && "isConnected" in result) {
      return result.isConnected;
    }
    return Boolean(result);
  } catch {
    return false;
  }
}

// Prompts the user to connect. Returns the public key string.
export async function connectWallet() {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error(
      "Freighter wallet is not installed. Get it at https://freighter.app"
    );
  }

  // requestAccess opens the Freighter popup and returns { address, error }
  const accessResult = await requestAccess();
  if (accessResult?.error) {
    throw new Error(`Wallet access denied: ${accessResult.error}`);
  }

  // address is the public key in v3
  const address =
    typeof accessResult === "string"
      ? accessResult
      : accessResult?.address;

  if (!address) throw new Error("No address returned from Freighter.");
  return address;
}

// Returns the currently connected address without prompting, or null.
export async function getConnectedAddress() {
  try {
    const result = await getAddress();
    if (typeof result === "string") return result || null;
    return result?.address || null;
  } catch {
    return null;
  }
}

// Shortens a Stellar address for display: "GABC...XYZ"
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
