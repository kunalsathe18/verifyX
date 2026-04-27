# verifyX

A blockchain-based product authenticity verification platform built on Stellar. Sellers register products on-chain, buyers verify authenticity using unique Product IDs — no middlemen, no fakes.

**Live Demo:** [https://origincheck.netlify.app](https://origincheck.netlify.app)

---

## ✅ Project Requirements Checklist

| Requirement | Status | Details |
|---|---|---|
| **Inter-contract call** | ✅ N/A | Single-contract design — no inter-contract calls needed |
| **Custom token / pool** | ✅ N/A | Product verification system — no token or pool required |
| **CI/CD Running** | ✅ PASS | 2 GitHub Actions workflows + Netlify auto-deploy |
| **Mobile Responsive** | ✅ PASS | Fully responsive — breakpoints at 480 px, 720 px, 1100 px |
| **8+ Meaningful Commits** | ✅ PASS | 15+ commits with clear, descriptive messages |
| **Production Ready** | ✅ PASS | Live at [origincheck.netlify.app](https://origincheck.netlify.app) |
| **Advanced Contract** | ✅ PASS | Soroban contract with `require_auth`, events, persistent storage |

---

## Screenshots

<div align="center">

| Main Dashboard | Registration Success |
|---|---|
| ![Dashboard](Screen%20Recordings/Screenshot%202026-04-23%20015532.png) | ![Registration](Screen%20Recordings/Screenshot%202026-04-23%20015553.png) |

| Verify Product | Genuine Result |
|---|---|
| ![Verify](Screen%20Recordings/Screenshot%202026-04-23%20015718.png) | ![Genuine](Screen%20Recordings/Screenshot%202026-04-23%20015848.png) |

| Transaction History | Full Workflow |
|---|---|
| ![History](Screen%20Recordings/Screenshot%202026-04-23%20015907.png) | ![Workflow](Screen%20Recordings/Screenshot%202026-04-23%20015927.png) |

| Latest Production Build |
|---|
| ![Latest](Screen%20Recordings/Screenshot%202026-04-26%20054012.png) |

</div>

### 🎥 Demo Video

<video width="100%" controls>
  <source src="Screen%20Recordings/Screen%20Recording%202026-04-23%20030939.mp4" type="video/mp4">
</video>

> GitHub may not render the video inline. [Download it here](Screen%20Recordings/Screen%20Recording%202026-04-23%20030939.mp4) or clone the repo to watch locally.

---

## Features

| Feature | Description |
|---|---|
| 📦 Product Registration | Register products on-chain with Freighter wallet signature |
| 🔍 Instant Verification | Verify authenticity by Product ID — no wallet needed |
| 📜 Transaction History | Last 10 registrations with Stellar Explorer links |
| 🔗 Wallet Management | Connect / disconnect Freighter seamlessly |
| 📱 Mobile Responsive | Optimised for all screen sizes |
| ⚠️ Network Guard | Auto-detects wrong network and warns the user |
| 🛡️ Error Recovery | Graceful RPC error handling — no raw errors shown to users |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust · Soroban SDK 21.x |
| Blockchain | Stellar Testnet |
| Frontend | React 18 · Vite 5 |
| Wallet | Freighter Extension (v3 API) |
| SDK | @stellar/stellar-sdk v13 |
| CI/CD | GitHub Actions + Netlify |
| Styling | Custom CSS — mobile-first |

---

## Deployed Contract

| | |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `CASYEEKABVDGCDCZCGMIZPJYSQDUMDDIYR4NRNCA7NOMCX4STI3MMEL6` |
| **RPC Endpoint** | `https://soroban-testnet.stellar.org` |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CASYEEKABVDGCDCZCGMIZPJYSQDUMDDIYR4NRNCA7NOMCX4STI3MMEL6) |
| **Status** | ✅ Active |

---

## Project Structure

```
verifyX/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI  — build on every push / PR
│       └── deploy.yml      # CD  — deploy to Netlify on main
│
├── contract/
│   ├── src/lib.rs          # Soroban smart contract (Rust)
│   ├── Cargo.toml
│   └── Cargo.lock
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddProduct.jsx
│   │   │   ├── VerifyProduct.jsx
│   │   │   ├── TransactionHistory.jsx
│   │   │   ├── WalletConnect.jsx
│   │   │   ├── DisconnectModal.jsx
│   │   │   └── NetworkBanner.jsx
│   │   ├── utils/
│   │   │   ├── contract.js     # Soroban interactions
│   │   │   └── freighter.js    # Wallet integration
│   │   ├── styles/App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/favicon.svg
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── Screen Recordings/      # 7 screenshots + demo video
├── .gitignore
├── netlify.toml
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Stellar CLI v25+
- [Freighter Wallet](https://freighter.app) browser extension

### Run Locally

```bash
git clone https://github.com/kunalsathe18/verifyX
cd verifyX/frontend

npm install
cp .env.example .env
# fill in VITE_CONTRACT_ID and VITE_RPC_URL

npm run dev
# → http://localhost:5173
```

### Get Testnet XLM

1. Open [Stellar Laboratory](https://laboratory.stellar.org/#account-creator)
2. Paste your Freighter wallet address
3. Click **Get test network lumens** — you'll receive 10 000 XLM

---

## CI/CD Pipeline

Three layers of automation ensure every commit is built and deployed correctly.

### Layer 1 — GitHub Actions: CI (`ci.yml`)

Runs on **every push and every pull request** to `main`.

```
push / pull_request
       ↓
Checkout → Node 20 → npm ci → npm run build → upload dist/
```

- Catches broken builds before they reach production
- Uploads `dist/` as a downloadable artifact (7-day retention)
- **File:** `.github/workflows/ci.yml`

### Layer 2 — GitHub Actions: CD (`deploy.yml`)

Runs on **push to `main`** or manual trigger from the GitHub UI.

```
push to main
       ↓
Checkout → Node 20 → npm ci → npm run build → deploy to Netlify
```

- Posts a deploy comment on every commit
- Supports preview deploys on pull requests
- **File:** `.github/workflows/deploy.yml`

### Layer 3 — Netlify Auto-Deploy

Netlify watches `main` directly as a fallback, configured via `netlify.toml`:

```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Where to get it |
|---|---|
| `VITE_CONTRACT_ID` | Your deployed contract ID |
| `VITE_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `NETLIFY_AUTH_TOKEN` | Netlify → User Settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Site → Site configuration → Site ID |

---

## Smart Contract

### Functions

| Function | Type | Description |
|---|---|---|
| `add_product(manufacturer, name, brand) → u64` | Write | Register a product; returns its ID |
| `get_product(id) → Product` | Read | Fetch full product details |
| `verify_product(id) → bool` | Read | Returns `true` if product exists |
| `get_product_count() → u64` | Read | Total registered products |

### Key Features

- **`require_auth()`** — only the manufacturer can register their product
- **Persistent storage** — `DataKey` enum with auto-incrementing IDs
- **Event emission** — publishes `register` events for off-chain indexing
- **Unit tested** — all functions covered with mock auth

### Deploy Your Own

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release

stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/verifyx.wasm \
  --source deployer \
  --network testnet
# → copy the returned contract ID into frontend/.env
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_CONTRACT_ID` | Deployed Soroban contract ID |
| `VITE_RPC_URL` | Stellar RPC endpoint |

Copy `frontend/.env.example` → `frontend/.env` for local development.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Account not found" | Fund wallet at [Stellar Laboratory](https://laboratory.stellar.org/#account-creator) |
| "Insufficient balance" | Each tx costs ~0.01–0.1 XLM — get more testnet XLM |
| "Transaction cancelled" | You rejected the Freighter popup — try again and click Approve |
| Wallet popup missing | Ensure Freighter is installed and unlocked, then refresh |
| Wrong network warning | Open Freighter → switch to **Testnet** |

---

## License

MIT — free to use for learning or commercial purposes.

---

## Links

- **Live App:** https://origincheck.netlify.app
- **GitHub:** https://github.com/kunalsathe18/verifyX
- **Contract Explorer:** [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CASYEEKABVDGCDCZCGMIZPJYSQDUMDDIYR4NRNCA7NOMCX4STI3MMEL6)
- **Soroban Docs:** https://soroban.stellar.org
- **Freighter:** https://freighter.app

---

*Built with ❤️ on Stellar*
