// ============================================================
// contract.js  –  verifyX
// @stellar/stellar-sdk v13  (protocol 21)
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

import { signTransaction } from "@stellar/freighter-api";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
export const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ID || "YOUR_CONTRACT_ID_HERE";

export const NETWORK_PASSPHRASE = Networks.TESTNET;

const RPC_URL =
  import.meta.env.VITE_RPC_URL || "https://soroban-testnet.stellar.org";

const server = new rpc.Server(RPC_URL, { allowHttp: false });

// ─────────────────────────────────────────────
// toXdrBase64  –  helper
// TransactionBuilder.toXDR() returns a Buffer in browser
// environments. Freighter needs a base64 string.
// ─────────────────────────────────────────────
function toXdrBase64(tx) {
  const raw = tx.toXDR();
  // If it's already a string, return as-is
  if (typeof raw === "string") return raw;
  // Convert Buffer / Uint8Array → base64 string
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

// ─────────────────────────────────────────────
// buildAndSubmit  –  internal helper
// ─────────────────────────────────────────────
async function buildAndSubmit(publicKey, operation) {
  // Fetch latest account state
  const account = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // Simulate to get Soroban resource footprint
  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  // Assemble adds footprint + fee bump data Soroban needs
  const preparedTx = rpc.assembleTransaction(tx, simResult).build();

  // Convert to base64 XDR string for Freighter
  const xdrBase64 = toXdrBase64(preparedTx);

  // Ask Freighter to sign
  const signResult = await signTransaction(xdrBase64, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  // freighter-api v3 returns { signedTxXdr, signerAddress } or a string
  const signedXdr =
    typeof signResult === "string" ? signResult : signResult?.signedTxXdr;

  if (!signedXdr) {
    throw new Error("Freighter did not return a signed transaction.");
  }

  // Reconstruct the signed transaction from XDR
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // Submit to the network
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(
      `Submit failed: ${JSON.stringify(sendResult.errorResult)}`
    );
  }

  // Poll until confirmed
  let getResult = await server.getTransaction(sendResult.hash);
  let attempts = 0;
  while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    if (attempts++ > 20) throw new Error("Transaction timed out after 30s");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    getResult = await server.getTransaction(sendResult.hash);
  }

  if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error("Transaction failed on-chain");
  }

  return getResult;
}

// ─────────────────────────────────────────────
// addProduct
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
// getProduct  –  read-only simulation
// ─────────────────────────────────────────────
export async function getProduct(id) {
  const dummyAccount = new Account(
    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    "0"
  );

  const tx = new TransactionBuilder(dummyAccount, {
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
    return null; // not found → show Fake
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
// verifyProduct  –  read-only simulation
// ─────────────────────────────────────────────
export async function verifyProduct(id) {
  const dummyAccount = new Account(
    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    "0"
  );

  const tx = new TransactionBuilder(dummyAccount, {
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
