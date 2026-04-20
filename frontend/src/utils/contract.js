// ============================================================
// contract.js  –  verifyX
// @stellar/stellar-sdk v13  ·  @stellar/freighter-api v3
// ============================================================

import {
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Account,
  Operation,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";

import { signTx, TESTNET_PASSPHRASE } from "./freighter";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
export const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ID || "YOUR_CONTRACT_ID_HERE";

export const NETWORK_PASSPHRASE = Networks.TESTNET; // same as TESTNET_PASSPHRASE

const RPC_URL =
  import.meta.env.VITE_RPC_URL || "https://soroban-testnet.stellar.org";

const server = new rpc.Server(RPC_URL, { allowHttp: false });

// Well-known Stellar account used for read-only simulations (no auth needed).
// Instantiated lazily inside functions to avoid module-load validation errors.
const DUMMY_ADDRESS = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
function dummyAccount() {
  return new Account(DUMMY_ADDRESS, "0");
}

// ─────────────────────────────────────────────
// toXdrBase64  –  Freighter needs a base64 string
// ─────────────────────────────────────────────
function toXdrBase64(tx) {
  const raw = tx.toXDR();
  if (typeof raw === "string") return raw;
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

// ─────────────────────────────────────────────
// buildAndSubmit  –  build → simulate → sign → submit → poll
// ─────────────────────────────────────────────
async function buildAndSubmit(publicKey, operation) {
  // Fetch latest sequence number for the signer's account
  const account = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60) // 60 seconds — enough for testnet latency
    .build();

  // Simulate to get Soroban resource footprint + fee
  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  // assembleTransaction injects footprint + resource fee
  const preparedTx = rpc.assembleTransaction(tx, simResult).build();

  // Sign via Freighter (v3)
  const signedXdr = await signTx(toXdrBase64(preparedTx));

  // Reconstruct signed transaction from XDR
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // Submit to the network
  const sendResult = await server.sendTransaction(signedTx);

  // "ERROR" status means the transaction was rejected before ledger close.
  // errorResult is an XDR object — convert safely via toXDR().toString('base64')
  if (sendResult.status === "ERROR") {
    let reason = "unknown error";
    try {
      // Try to get a readable string without triggering XDR union parsing
      reason = sendResult.errorResult?.toXDR("base64") ?? reason;
    } catch {
      reason = String(sendResult.errorResult ?? reason);
    }
    throw new Error(`Transaction rejected by network: ${reason}`);
  }

  // "DUPLICATE" means this exact tx was already submitted — treat as success
  // and poll for the result using the hash
  const hash = sendResult.hash;
  if (!hash) throw new Error("No transaction hash returned from network.");

  // Poll until ledger confirms (or timeout after ~45s)
  let getResult;
  for (let i = 0; i < 30; i++) {
    getResult = await server.getTransaction(hash);
    if (getResult.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) break;
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (!getResult || getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new Error("Transaction timed out — not confirmed after 45s. Try again.");
  }

  if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
    // resultXdr gives a readable failure reason
    let reason = "on-chain execution failed";
    try {
      reason = getResult.resultXdr?.toXDR("base64") ?? reason;
    } catch {
      reason = String(getResult.resultXdr ?? reason);
    }
    throw new Error(`Transaction failed on-chain: ${reason}`);
  }

  return getResult;
}

// ─────────────────────────────────────────────
// addProduct  –  write (requires wallet signature)
// ─────────────────────────────────────────────
export async function addProduct(publicKey, name, brand) {
  const operation = Operation.invokeContractFunction({
    contract: CONTRACT_ID,
    function: "add_product",
    args: [
      new Address(publicKey).toScVal(),
      nativeToScVal(name, { type: "string" }),
      nativeToScVal(brand, { type: "string" }),
    ],
  });

  const result = await buildAndSubmit(publicKey, operation);

  if (result.returnValue) {
    return Number(scValToNative(result.returnValue));
  }
  return null;
}

// ─────────────────────────────────────────────
// getProduct  –  read-only simulation, no wallet needed
// ─────────────────────────────────────────────
export async function getProduct(id) {
  const tx = new TransactionBuilder(dummyAccount(), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: "get_product",
        args: [nativeToScVal(BigInt(id), { type: "u64" })],
      })
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    return null; // product not found → show Fake
  }

  const raw = scValToNative(simResult.result.retval);

  return {
    id:           Number(raw.id),
    name:         raw.name,
    brand:        raw.brand,
    manufacturer: raw.manufacturer.toString(),
  };
}

// ─────────────────────────────────────────────
// verifyProduct  –  read-only simulation, no wallet needed
// ─────────────────────────────────────────────
export async function verifyProduct(id) {
  const tx = new TransactionBuilder(dummyAccount(), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: "verify_product",
        args: [nativeToScVal(BigInt(id), { type: "u64" })],
      })
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    return false;
  }

  return scValToNative(simResult.result.retval);
}
