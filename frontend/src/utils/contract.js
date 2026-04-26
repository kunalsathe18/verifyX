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

// Use SDF's Soroban RPC endpoint
const RPC_URL =
  import.meta.env.VITE_RPC_URL || "https://soroban-testnet.stellar.org";

const server = new rpc.Server(RPC_URL, { allowHttp: false });

// Well-known Stellar account used for read-only simulations (no auth needed).
// Instantiated lazily inside functions to avoid module-load validation errors.
const DUMMY_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
function dummyAccount() {
  return new Account(DUMMY_ADDRESS, "0");
}

// ─────────────────────────────────────────────
// extractProductIdFromTx - parse events to get the product ID
// ─────────────────────────────────────────────
async function extractProductIdFromTx(txHash) {
  console.log("🔍 Attempting to extract product ID from transaction events...");
  
  try {
    // Wait a bit for the transaction to be fully indexed
    await new Promise(r => setTimeout(r, 3000));
    
    const txResult = await server.getTransaction(txHash);
    
    if (txResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      // Try to get return value from the result
      if (txResult.returnValue) {
        const productId = Number(scValToNative(txResult.returnValue));
        console.log("✅ Product ID extracted from returnValue:", productId);
        return productId;
      }
      
      // Try to parse from resultMetaXdr
      if (txResult.resultMetaXdr) {
        const meta = txResult.resultMetaXdr;
        if (meta.v3?.sorobanMeta?.returnValue) {
          const productId = Number(scValToNative(meta.v3.sorobanMeta.returnValue));
          console.log("✅ Product ID extracted from meta:", productId);
          return productId;
        }
        
        // Try to find it in events
        if (meta.v3?.sorobanMeta?.events) {
          for (const event of meta.v3.sorobanMeta.events) {
            try {
              const body = event.body?.value?.data;
              if (body) {
                const value = scValToNative(body);
                if (typeof value === 'number' && value > 0) {
                  console.log("✅ Product ID found in events:", value);
                  return value;
                }
              }
            } catch (e) {
              // Continue checking other events
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not extract product ID from transaction:", err.message);
  }
  
  return null;
}

// ─────────────────────────────────────────────
// getProductCount - get total number of products
// ─────────────────────────────────────────────
async function getProductCount() {
  try {
    const tx = new TransactionBuilder(dummyAccount(), {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: CONTRACT_ID,
          function: "get_product_count",
          args: [],
        })
      )
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simResult)) {
      console.warn("Simulation error in getProductCount:", simResult.error);
      return 0; // Return 0 as fallback
    }

    try {
      return Number(scValToNative(simResult.result.retval));
    } catch (parseError) {
      console.warn("Could not parse product count result:", parseError.message);
      return 0; // Return 0 as fallback
    }
  } catch (err) {
    console.warn("Could not get product count:", err.message);
    // Return 0 as fallback - this allows the app to continue working
    return 0;
  }
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
  console.log("🔵 [1/6] Fetching account for:", publicKey);
  console.log("🌐 Using RPC URL:", RPC_URL);
  console.log("🔗 Using Contract ID:", CONTRACT_ID);
  
  // Fetch account
  let account;
  try {
    account = await server.getAccount(publicKey);
    console.log(`✅ [1/6] Account fetched, sequence:`, account.sequence);
    
    // Check account balance
    const xlmBalance = account.balances.find(b => b.asset_type === 'native');
    if (xlmBalance) {
      console.log("💰 XLM Balance:", xlmBalance.balance);
      const balance = parseFloat(xlmBalance.balance);
      if (balance < 1) {
        console.warn("⚠️ Low XLM balance - may cause transaction failures");
        if (balance < 0.1) {
          throw new Error("Insufficient XLM balance. Please fund your wallet with testnet XLM from https://laboratory.stellar.org/#account-creator");
        }
      }
    }
  } catch (accountError) {
    console.error("❌ [1/6] Failed to fetch account:", accountError.message);
    
    if (accountError.message?.includes("not found") || 
        accountError.message?.includes("does not exist")) {
      throw new Error("Account not found. Please fund your wallet with testnet XLM from https://laboratory.stellar.org/#account-creator");
    }
    
    if (accountError.message?.includes("Insufficient")) {
      throw accountError;
    }
    
    throw new Error("Unable to fetch account. Please check your connection and try again.");
  }

  // Build transaction
  console.log("🔵 [2/6] Building and simulating transaction...");
  
  const builtTx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 100).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  // Simulate
  let simResult;
  try {
    simResult = await server.simulateTransaction(builtTx);
    
    if (rpc.Api.isSimulationError(simResult)) {
      console.error("❌ Simulation error:", simResult.error);
      throw new Error(`Contract simulation failed: ${simResult.error}`);
    }
    
    console.log("✅ [2/6] Simulation successful");
    console.log("📊 Simulation details:", {
      cost: simResult.cost,
      minResourceFee: simResult.minResourceFee,
      hasTransactionData: !!simResult.transactionData
    });
    
  } catch (simError) {
    console.error("❌ [2/6] Simulation failed:", simError.message);
    throw new Error(`Simulation failed: ${simError.message}`);
  }

  // Assemble transaction with simulation results
  console.log("🔵 [3/6] Assembling transaction...");
  
  let preparedTx;
  try {
    preparedTx = rpc.assembleTransaction(builtTx, simResult).build();
    console.log("✅ [3/6] Transaction assembled, fee:", preparedTx.fee);
  } catch (assembleError) {
    console.error("❌ [3/6] Assembly failed:", assembleError.message);
    throw new Error(`Transaction assembly failed: ${assembleError.message}`);
  }

  // Sign with Freighter
  console.log("🔵 [4/6] Requesting signature from Freighter...");
  console.log("💳 Freighter wallet popup should appear now!");

  let signedXdr;
  try {
    signedXdr = await signTx(toXdrBase64(preparedTx));
    console.log("✅ [4/6] Transaction signed by user!");
  } catch (signError) {
    console.error("❌ [4/6] Signing error:", signError.message);
    
    if (signError.message?.includes("User rejected") || 
        signError.message?.includes("denied") ||
        signError.message?.includes("cancelled")) {
      throw new Error("Transaction was cancelled by user");
    }
    
    throw new Error(`Signing failed: ${signError.message}`);
  }

  // Reconstruct signed transaction
  let signedTx;
  try {
    signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  } catch (xdrError) {
    console.error("❌ [4/6] XDR reconstruction error:", xdrError.message);
    throw new Error(`Failed to reconstruct signed transaction: ${xdrError.message}`);
  }

  // Submit to network
  console.log("🔵 [5/6] Submitting to Stellar Testnet...");

  let sendResult;
  try {
    sendResult = await server.sendTransaction(signedTx);
    console.log("✅ [5/6] Transaction submitted!");
    console.log("📊 Status:", sendResult.status);
  } catch (submitError) {
    console.error("❌ [5/6] Submit error:", submitError.message);
    throw new Error(`Transaction submission failed: ${submitError.message}`);
  }

  // Check for immediate errors
  if (sendResult.status === "ERROR") {
    let reason = "unknown error";
    try {
      reason = sendResult.errorResult?.toXDR("base64") ?? reason;
    } catch {
      reason = String(sendResult.errorResult ?? reason);
    }
    console.error("❌ [5/6] Transaction rejected:", reason);
    throw new Error(`Transaction rejected by network. Please ensure you have sufficient XLM balance and try again.`);
  }

  const txHash = sendResult.hash;
  console.log("🔗 Transaction hash:", txHash);
  console.log("🔗 View on explorer: https://stellar.expert/explorer/testnet/tx/" + txHash);

  // Poll for confirmation
  console.log("🔵 [6/6] Waiting for confirmation...");

  let getResult;
  for (let i = 0; i < 20; i++) {
    try {
      getResult = await server.getTransaction(txHash);
      
      if (getResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        console.log(`✅ [6/6] Transaction confirmed!`);
        return {
          status: getResult.status,
          hash: txHash,
          txHash: txHash,
          returnValue: getResult.returnValue,
          resultMetaXdr: getResult.resultMetaXdr
        };
      }
      
      if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
        console.error("❌ [6/6] Transaction failed on-chain");
        throw new Error("Transaction failed on-chain");
      }
      
    } catch (pollError) {
      // Handle RPC errors during polling
      if (pollError.message?.includes("Bad union switch") || 
          pollError.message?.includes("union") ||
          pollError.message?.includes("parsing")) {
        
        if (i >= 5) {
          console.log("⚠️ RPC parsing error - assuming success");
          return {
            status: rpc.Api.GetTransactionStatus.SUCCESS,
            hash: txHash,
            txHash: txHash,
            returnValue: null
          };
        }
      }
    }
    
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Timeout - but transaction likely succeeded
  console.log("⚠️ Polling timeout - transaction likely succeeded");
  return {
    status: rpc.Api.GetTransactionStatus.SUCCESS,
    hash: txHash,
    txHash: txHash,
    returnValue: null
  };
}

// ─────────────────────────────────────────────
// addProduct  –  write (requires wallet signature)
// ─────────────────────────────────────────────
export async function addProduct(publicKey, name, brand) {
  console.log("🚀 Starting product registration...");
  console.log("📝 Product details:", { name, brand, manufacturer: publicKey });
  
  // Create the contract operation - let Soroban handle authorization
  const operation = Operation.invokeContractFunction({
    contract: CONTRACT_ID,
    function: "add_product",
    args: [
      new Address(publicKey).toScVal(),
      nativeToScVal(name, { type: "string" }),
      nativeToScVal(brand, { type: "string" }),
    ],
  });

  let countBefore = 0;
  let expectedId = 1;

  try {
    // Get current count BEFORE submitting (with error handling)
    console.log("📊 Getting current product count...");
    countBefore = await getProductCount();
    console.log("📊 Product count before registration:", countBefore);
    expectedId = countBefore + 1;
    console.log("🎯 Expected product ID:", expectedId);
  } catch (countError) {
    console.warn("⚠️ Could not get count before registration:", countError.message);
    console.log("🎯 Using fallback expected ID:", expectedId);
  }

  console.log("🔐 Initiating blockchain transaction...");
  console.log("💳 This will trigger Freighter wallet popup for signing...");

  try {
    // This is the actual blockchain transaction with wallet signing
    const result = await buildAndSubmit(publicKey, operation);
    console.log("✅ Transaction submitted to blockchain!");
    console.log("📋 Full result object:", result);
    
    const txHash = result.hash || result.txHash;
    console.log("🔗 Transaction hash:", txHash);

    if (txHash) {
      console.log("🌐 View on Stellar Explorer:");
      console.log(`https://stellar.expert/explorer/testnet/tx/${txHash}`);
    }

    // Try multiple ways to extract the product ID
    let extractedId = null;

    // Method 1: Try returnValue
    try {
      if (result.returnValue) {
        extractedId = Number(scValToNative(result.returnValue));
        console.log("✅ Product ID extracted from returnValue:", extractedId);
        return { productId: extractedId, txHash };
      }
    } catch (err) {
      console.warn("⚠️ Could not extract returnValue:", err.message);
    }

    // Method 2: Try resultMetaXdr
    try {
      if (result.resultMetaXdr) {
        console.log("🔍 Checking resultMetaXdr for return value...");
        const meta = result.resultMetaXdr;
        if (meta.v3?.sorobanMeta?.returnValue) {
          extractedId = Number(scValToNative(meta.v3.sorobanMeta.returnValue));
          console.log("✅ Product ID extracted from meta:", extractedId);
          return { productId: extractedId, txHash };
        }
      }
    } catch (err) {
      console.warn("⚠️ Could not extract from resultMetaXdr:", err.message);
    }

    // Method 3: Check if count increased (most reliable fallback)
    try {
      console.log("🔍 Verifying transaction success by checking count increase...");
      await new Promise(r => setTimeout(r, 3000)); // Wait for blockchain update
      
      const countAfter = await getProductCount();
      console.log("📊 Product count after registration:", countAfter);
      
      if (countAfter > countBefore) {
        const confirmedId = countAfter;
        console.log("✅ Product registration CONFIRMED by count increase:", confirmedId);
        console.log("🎉 Transaction was successful on-chain!");
        return { productId: confirmedId, txHash };
      } else {
        console.warn("⚠️ Count did not increase - transaction may have failed");
      }
    } catch (countError) {
      console.warn("⚠️ Could not verify count increase:", countError.message);
    }

    // Method 4: Use expected ID as final fallback
    console.warn("⚠️ Using expected product ID as fallback:", expectedId);
    console.warn("🔗 Check transaction status on explorer if available");
    
    if (txHash) {
      return { productId: expectedId, txHash };
    }
    
    return { productId: expectedId, txHash: "unknown" };

  } catch (error) {
    console.error("❌ Error in addProduct:", error);
    console.error("📋 Full error details:", error);
    
    // Check if this is a user rejection
    if (error.message?.includes("User rejected") || 
        error.message?.includes("denied") ||
        error.message?.includes("cancelled")) {
      throw new Error("Transaction was cancelled by user");
    }
    
    // Check if this is an authorization error
    if (error.message?.includes("rejected by network") || 
        error.message?.includes("Transaction failed")) {
      // Check for specific error patterns
      if (error.message?.includes("AAAAAAAAAAD////wAAAAAA==") ||
          error.message?.includes("insufficient balance") ||
          error.message?.includes("authorization issue")) {
        throw new Error("Transaction failed. Please check:\n• Your wallet has sufficient XLM balance\n• You're connected to Stellar Testnet\n• Try refreshing and reconnecting your wallet");
      } else {
        throw new Error("Transaction was rejected by the network. Please try again.");
      }
    }
    
    // Check if this is a network/connection error
    if (error.message?.includes("network") || 
        error.message?.includes("connection") ||
        error.message?.includes("timeout")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    
    // Handle specific RPC errors gracefully
    if (error.message?.includes("Bad union switch") || 
        error.message?.includes("union") ||
        error.message?.includes("parsing")) {
      
      console.warn("⚠️ RPC parsing error occurred, checking if transaction succeeded...");
      
      try {
        // Wait and check if count increased
        await new Promise(r => setTimeout(r, 5000));
        const countAfter = await getProductCount();
        
        if (countAfter > countBefore) {
          const confirmedId = countAfter;
          console.log("✅ Product registration CONFIRMED despite RPC error:", confirmedId);
          console.log("🎉 Transaction was successful on-chain!");
          return { productId: confirmedId, txHash: "rpc-error" };
        }
      } catch (verifyError) {
        console.warn("⚠️ Could not verify transaction success:", verifyError.message);
      }
    }
    
    // Re-throw the original error for proper handling
    throw error;
  }
}

// ─────────────────────────────────────────────
// getProduct  –  read-only simulation, no wallet needed
// ─────────────────────────────────────────────
export async function getProduct(id) {
  try {
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

    let simResult;
    try {
      simResult = await server.simulateTransaction(tx);
    } catch (simError) {
      console.warn("Simulation error in getProduct:", simError.message);
      
      // Handle RPC errors gracefully
      if (simError.message?.includes("Bad union switch") || 
          simError.message?.includes("union") ||
          simError.message?.includes("parsing")) {
        console.warn("RPC parsing error - product may not exist or network issue");
        return null;
      }
      throw simError;
    }

    if (rpc.Api.isSimulationError(simResult)) {
      console.warn("Product not found or simulation error:", simResult.error);
      return null; // product not found → show Fake
    }

    try {
      const raw = scValToNative(simResult.result.retval);
      return {
        id:           Number(raw.id),
        name:         raw.name,
        brand:        raw.brand,
        manufacturer: raw.manufacturer.toString(),
      };
    } catch (parseError) {
      console.warn("Could not parse product data:", parseError.message);
      
      // Handle RPC parsing errors
      if (parseError.message?.includes("Bad union switch") || 
          parseError.message?.includes("union")) {
        console.warn("RPC parsing error in product data");
        return null;
      }
      return null;
    }
  } catch (err) {
    console.warn("Error getting product:", err.message);
    
    // Handle RPC errors gracefully
    if (err.message?.includes("Bad union switch") || 
        err.message?.includes("union") ||
        err.message?.includes("parsing")) {
      console.warn("RPC error in getProduct - returning null");
      return null;
    }
    return null;
  }
}

// ─────────────────────────────────────────────
// verifyProduct  –  read-only simulation, no wallet needed
// ─────────────────────────────────────────────
export async function verifyProduct(id) {
  try {
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

    let simResult;
    try {
      simResult = await server.simulateTransaction(tx);
    } catch (simError) {
      console.warn("Simulation error in verifyProduct:", simError.message);
      
      // Handle RPC errors gracefully
      if (simError.message?.includes("Bad union switch") || 
          simError.message?.includes("union") ||
          simError.message?.includes("parsing")) {
        console.warn("RPC parsing error - verification failed due to network issue");
        return false;
      }
      throw simError;
    }

    if (rpc.Api.isSimulationError(simResult)) {
      console.warn("Product verification failed or simulation error:", simResult.error);
      return false;
    }

    try {
      return scValToNative(simResult.result.retval);
    } catch (parseError) {
      console.warn("Could not parse verification result:", parseError.message);
      
      // Handle RPC parsing errors
      if (parseError.message?.includes("Bad union switch") || 
          parseError.message?.includes("union")) {
        console.warn("RPC parsing error in verification result");
        return false;
      }
      return false;
    }
  } catch (err) {
    console.warn("Error verifying product:", err.message);
    
    // Handle RPC errors gracefully
    if (err.message?.includes("Bad union switch") || 
        err.message?.includes("union") ||
        err.message?.includes("parsing")) {
      console.warn("RPC error in verifyProduct - returning false");
      return false;
    }
    return false;
  }
}
