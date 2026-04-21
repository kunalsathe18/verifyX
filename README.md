# verifyX

Blockchain-based product authenticity verification on the Stellar network. Sellers register products on-chain, buyers verify genuineness using a unique Product ID.

**Live:** [origincheck.netlify.app](https://origincheck.netlify.app)

---

## Stack

| Layer | Tech |
|---|---|
| Smart Contract | Rust · Soroban SDK 21.x |
| Blockchain | Stellar Testnet |
| Frontend | React · Vite |
| Wallet | Freighter Extension |
| Hosting | Netlify |

---

## Deployed Contract

| | |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `CAZLH6BM7ZCQKJFQK65LMZ2JVKBNWPA322QK4UNNG4OGXBZVXCHYOHCW` |
| **Explorer** | [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CAZLH6BM7ZCQKJFQK65LMZ2JVKBNWPA322QK4UNNG4OGXBZVXCHYOHCW) |

> Previously deployed contract (revoked): `CBZFP5LCW7SCY5XOD5KMITXEMAJSUC3KNN3THM7OUEP2D6JIJSFRGLXI`

---

## Project Structure

```
verifyX/
├── contract/
│   ├── src/lib.rs          # Soroban smart contract
│   ├── Cargo.toml
│   └── Cargo.lock
├── frontend/
│   ├── src/
│   │   ├── components/     # WalletConnect, AddProduct, VerifyProduct, NetworkBanner
│   │   ├── utils/          # contract.js, freighter.js
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── vite.config.js
├── netlify.toml
└── README.md
```

---

## Local Development

**Prerequisites:** Rust, Stellar CLI v25+, Node.js v18+, Freighter browser extension

```bash
# 1. Clone and install frontend deps
git clone https://github.com/kunalsathe18/verifyX
cd verifyX/frontend
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your contract ID

# 3. Run dev server
npm run dev
```

---

## Contract Deployment

```bash
# Build
cd contract
stellar contract build

# Create and fund a testnet identity
stellar keys generate alice --network testnet
stellar keys fund alice --network testnet

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/verifyx.wasm \
  --source alice \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

---

## CI/CD Pipeline

This project uses **Netlify's built-in CI/CD**:

- Every push to the `main` branch triggers an automatic production deployment
- Netlify runs `npm run build` inside `frontend/` using the config in `netlify.toml`
- Environment variables (`VITE_CONTRACT_ID`, `VITE_RPC_URL`) are managed in Netlify's dashboard — never committed to the repo
- Build status is visible under the **Deploys** tab on Netlify

```
git push origin main
       │
       ▼
  Netlify detects push
       │
       ▼
  npm run build (Vite)
       │
       ▼
  Deploy to origincheck.netlify.app
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_CONTRACT_ID` | Deployed Soroban contract ID |
| `VITE_RPC_URL` | Stellar RPC endpoint (default: testnet) |

Copy `frontend/.env.example` to `frontend/.env` for local development.

---

## How It Works

1. Seller connects Freighter wallet (Testnet)
2. Seller registers a product — transaction signed on-chain
3. A unique Product ID is returned
4. Buyer enters the Product ID to verify authenticity
5. Contract confirms **Genuine ✅** or **Not Found ❌**

---

## License

MIT
