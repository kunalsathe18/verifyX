# 🔐 verifyX — Product Authenticity on the Blockchain

verifyX lets **sellers register products** on the Stellar blockchain and lets
**buyers verify** whether a product is genuine — all without a middleman.

Built with:
- **Smart contract** → Rust + Soroban SDK (Stellar)
- **Frontend** → React + Vite
- **Styling** → Plain CSS
- **Wallet** → Freighter browser extension

---

## 📁 Project Structure

```
verifyX/
├── contract/               ← Soroban smart contract (Rust)
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
│
├── frontend/               ← React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── WalletConnect.jsx
│       │   ├── AddProduct.jsx
│       │   └── VerifyProduct.jsx
│       ├── styles/
│       │   └── App.css
│       └── utils/
│           ├── contract.js     ← Stellar SDK calls
│           └── freighter.js    ← Wallet helpers
│
└── README.md
```

---

## ⚙️ Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Rust | stable | https://rustup.rs |
| Stellar CLI | latest | see below |
| Node.js | ≥ 18 | https://nodejs.org |
| Freighter wallet | latest | https://freighter.app |

### Install Stellar CLI

```bash
cargo install --locked stellar-cli --features opt
```

Verify:
```bash
stellar --version
```

---

## 🦀 Part 1 — Smart Contract

### 1. Build the contract

```bash
cd contract

# Add the WebAssembly target
rustup target add wasm32-unknown-unknown

# Build (optimised release)
stellar contract build
```

The compiled `.wasm` file will be at:
```
contract/target/wasm32-unknown-unknown/release/verifyx.wasm
```

### 2. Run tests

```bash
cd contract
cargo test
```

Expected output:
```
test tests::test_add_and_get_product ... ok
test tests::test_verify_product ... ok
```

### 3. Set up a Testnet identity

```bash
# Generate a new keypair called "alice" (or any name you like)
stellar keys generate alice --network testnet

# Fund it from the Testnet faucet
stellar keys fund alice --network testnet

# Check the address
stellar keys address alice
```

### 4. Deploy the contract to Testnet

```bash
cd contract

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/verifyx.wasm \
  --source alice \
  --network testnet
```

Copy the **Contract ID** printed in the output — you'll need it next.
It looks like: `CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 5. Test the contract via CLI

```bash
# Register a product (pass your own address as manufacturer)
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source alice \
  --network testnet \
  -- add_product \
  --manufacturer $(stellar keys address alice) \
  --name "iPhone 15 Pro" \
  --brand "Apple"

# Expected output: 1  (the new product ID)

# Verify it exists
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --network testnet \
  -- verify_product \
  --id 1

# Expected output: true

# Get full product details
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --network testnet \
  -- get_product \
  --id 1
```

---

## 💻 Part 2 — Frontend

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and paste your Contract ID:

```env
VITE_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_RPC_URL=https://soroban-testnet.stellar.org
```

### 3. Start the dev server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Build for production

```bash
npm run build
# Output goes to frontend/dist/
```

---

## 🦊 Freighter Wallet Setup

1. Install the **Freighter** extension:
   - Chrome: https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/freighter-wallet/

2. Create or import a wallet.

3. Switch to **Testnet**:
   - Click the network selector (top of the extension)
   - Choose **Test SDF Network / Horizon Testnet**

4. Fund your Testnet account:
   - Visit https://laboratory.stellar.org/#account-creator?network=test
   - Paste your public key and click "Create Account"

---

## 🧪 Sample Test Data

After deploying, register these products via the CLI or UI:

| ID | Name | Brand |
|----|------|-------|
| 1 | iPhone 15 Pro | Apple |
| 2 | Galaxy S24 Ultra | Samsung |
| 3 | MacBook Pro M3 | Apple |
| 4 | PlayStation 5 | Sony |

Then try verifying:
- ID **1** → ✅ Genuine
- ID **99** → ❌ Fake (not registered)

---

## 🔄 How It Works (Flow)

```
Seller                          Blockchain                    Buyer
  │                                  │                          │
  ├─ Connect Freighter wallet ──────►│                          │
  ├─ Fill product name + brand       │                          │
  ├─ Click "Register Product" ──────►│                          │
  │                          add_product()                      │
  │◄─ Returns Product ID ────────────┤                          │
  │                                  │                          │
  │  (shares Product ID with buyer)  │                          │
  │                                  │◄── Enter Product ID ─────┤
  │                                  │    get_product()         │
  │                                  ├──► Product details ──────►│
  │                                  │    or "not found"        │
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Freighter not installed" | Install the browser extension from freighter.app |
| "Contract not found" | Check VITE_CONTRACT_ID in your .env file |
| Transaction fails | Make sure your Testnet account is funded |
| Build fails | Run `rustup target add wasm32-unknown-unknown` |
| Buffer is not defined | The vite.config.js polyfill handles this — run `npm install` again |

---

## 📝 Contract API Reference

| Function | Args | Returns | Description |
|----------|------|---------|-------------|
| `add_product` | `name: String, brand: String` | `u64` | Register a product, returns its ID |
| `get_product` | `id: u64` | `Product` | Get product details (panics if not found) |
| `verify_product` | `id: u64` | `bool` | Returns true if product exists |
| `get_product_count` | — | `u64` | Total number of registered products |

---

## 🚀 Deployment Checklist

- [ ] `rustup target add wasm32-unknown-unknown`
- [ ] `stellar contract build` succeeds
- [ ] `cargo test` passes
- [ ] Testnet identity created and funded
- [ ] Contract deployed, Contract ID copied
- [ ] `.env` file updated with Contract ID
- [ ] `npm install` in frontend/
- [ ] Freighter installed and set to Testnet
- [ ] `npm run dev` starts without errors
