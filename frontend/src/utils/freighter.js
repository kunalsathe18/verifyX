// ============================================================
// freighter.js  –  @stellar/freighter-api v3
//
// v3 API:
//   isConnected()   → { isConnected: bool, error? }
//   getAddress()    → { address: string, error? }
//   requestAccess() → { address: string, error? }
//   getNetwork()    → { network: string, networkPassphrase: string, error? }
//   signTransaction(xdr, opts) → { signedTxXdr: string, signerAddress: string, error? }
// ============================================================

import {
  isConnected,
  getAddress,
  requestAccess,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";

export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

// ── Is Freighter installed? ──────────────────────────────────
export async function isFreighterInstalled() {
  try {
    const result = await isConnected();
    if (typeof result === "object" && "isConnected" in result) {
      return result.isConnected;
    }
    return Boolean(result);
  } catch {
    return false;
  }
}

// ── Connect wallet — prompts user if not already connected ───
export async function connectWallet(forcePrompt = false) {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error(
      "Freighter wallet is not installed. Get it at https://freighter.app"
    );
  }

  // Always use requestAccess to ensure popup appears
  // This is the only way to "reconnect" after disconnect
  const accessResult = await requestAccess();
  if (accessResult?.error) {
    throw new Error(`Wallet access denied: ${accessResult.error}`);
  }

  const address =
    typeof accessResult === "string"
      ? accessResult
      : accessResult?.address;

  if (!address) throw new Error("No address returned from Freighter.");

  // Validate the user is on Testnet
  await assertTestnet();

  return address;
}

// ── Get already-connected address without prompting ─────────
export async function getConnectedAddress() {
  // Check if user manually disconnected
  const isDisconnected = localStorage.getItem("wallet_manually_disconnected");
  if (isDisconnected === "true") {
    return null;
  }

  try {
    const result = await getAddress();
    if (typeof result === "string") return result || null;
    return result?.address || null;
  } catch {
    return null;
  }
}

// ── Check network — throws if not on Testnet ─────────────────
export async function assertTestnet() {
  try {
    const result = await getNetwork();
    const passphrase =
      typeof result === "string" ? result : result?.networkPassphrase;

    if (passphrase && passphrase !== TESTNET_PASSPHRASE) {
      throw new Error(
        "Freighter is connected to the wrong network. Please switch to Testnet inside the Freighter extension."
      );
    }
  } catch (err) {
    // Re-throw only our own error
    if (err.message?.includes("wrong network")) throw err;
    // If getNetwork fails for other reasons, let it pass silently
  }
}

// ── Sign a transaction XDR string ───────────────────────────
export async function signTx(xdrBase64) {
  await assertTestnet();

  // freighter-api v3 signTransaction signature:
  // signTransaction(xdr, { network?, networkPassphrase? })
  const result = await signTransaction(xdrBase64, {
    network: TESTNET_PASSPHRASE,
    networkPassphrase: TESTNET_PASSPHRASE,
  });

  if (result?.error) {
    throw new Error(`Signing failed: ${result.error}`);
  }

  const signedXdr =
    typeof result === "string" ? result : result?.signedTxXdr;

  if (!signedXdr) {
    throw new Error("Freighter did not return a signed transaction.");
  }

  return signedXdr;
}

// ── Shorten address for display: "GABC...XYZ" ───────────────
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
