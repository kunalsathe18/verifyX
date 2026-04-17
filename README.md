# verifyX

A blockchain-based product authenticity verification system built on the Stellar network. Sellers register products on-chain and buyers verify genuineness using a unique Product ID — no middlemen, no central database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust · Soroban SDK 21.x |
| Blockchain | Stellar Testnet |
| Frontend | React · Vite |
| Styling | Plain CSS |
| Wallet | Freighter Browser Extension |

---

## Project Structure

```
verifyX/
├── contract/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── WalletConnect.jsx
        │   ├── AddProduct.jsx
        │   └── VerifyProduct.jsx
        ├── styles/
        │   └── App.css
        └── utils/
            ├── contract.js
            └── freighter.js
```

---

## Prerequisites

- [Rust](https://rustup.rs) (stable)
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli) v25+
- [Node.js](https://nodejs.org) v18+
- [Freighter Wallet](https://freighter.app) browser extension

Install Stellar CLI:
```bash
cargo install --locked stellar-cli --features opt
```

Add the WebAssembly build target:
```bash
rustup target add wasm32v1-none
```

---

## Smart Contract

### Build

```bash
cd contract
stellar contract build
```

Output: `contract/target/wasm32v1-none/release/verifyx.wasm`

### Test

```bash
cargo test
```

### Deploy to Testnet

```bash
# Create and fund a testnet identity
stellar keys generate alice --network testnet
stellar keys fund alice --network testnet

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/verifyx.wasm \
  --source alice \
  --network testnet
```

Copy the Contract ID from the output — you will need it for the frontend.

### Contract Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `add_product` | `manufacturer: Address, name: String, brand: String` | `u64` | Register a product, returns its ID |
| `get_product` | `id: u64` | `Product` | Returns product details or panics if not found |
| `verify_product` | `id: u64` | `bool` | Returns true if the product exists |
| `get_product_count` | — | `u64` | Total number of registered products |

---

## Frontend

### Setup

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_CONTRACT_ID=YOUR_CONTRACT_ID_HERE
VITE_RPC_URL=https://soroban-testnet.stellar.org
```

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build
# Output: frontend/dist/
```

---

## Freighter Wallet Setup

1. Install Freighter from [freighter.app](https://freighter.app)
2. Create or import a wallet
3. Switch network to **Testnet** inside the extension
4. Fund your testnet address at [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)

---

## How It Works

```
Seller                        Blockchain                      Buyer
  |                               |                             |
  |-- Connect wallet ------------>|                             |
  |-- Register product (name,     |                             |
  |   brand) ------------------->|                             |
  |<-- Product ID returned -------|                             |
  |                               |                             |
  |   (Product ID shared          |<-- Enter Product ID --------|
  |    with buyer)                |--- Lookup on-chain -------->|
  |                               |<-- Genuine / Not Found -----|
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `wasm32v1-none` target missing | Run `rustup target add wasm32v1-none` |
| Freighter not detected | Install the extension and refresh the page |
| Transaction fails | Ensure your Freighter account is funded on Testnet |
| Contract ID not found | Verify `VITE_CONTRACT_ID` in `frontend/.env` |
| Freighter on wrong network | Switch to Testnet inside the Freighter extension |

---

## License

MIT
