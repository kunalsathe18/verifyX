# verifyX

A blockchain-based product authenticity platform built on Stellar. Sellers register products on-chain, the community approves them via multi-signature, and buyers verify authenticity instantly — no middlemen, no fakes.

**Live Demo:** [https://verify-x-seven.vercel.app](https://verify-x-seven.vercel.app)

---

## Requirements Checklist

| Requirement | Status | Evidence |
|---|---|---|
| CI/CD Running | ✅ PASS | 2 GitHub Actions workflows + Vercel auto-deploy |
| Mobile Responsive | ✅ PASS | Breakpoints at 480px, 720px, 1100px — see screenshots below |
| 8+ Meaningful Commits | ✅ PASS | 15+ commits on main branch |
| Production Ready | ✅ PASS | Live at [verify-x-seven.vercel.app](https://verify-x-seven.vercel.app) |
| Advanced Contract | ✅ PASS | Multi-sig, `require_auth`, events, persistent storage |
| 30+ Users | ✅ PASS | Supabase DB + [user spreadsheet](https://docs.google.com/spreadsheets/d/1yzMdzSmkJxzERzZM6oYzkIceyxxSDrCyXWIHMFHjkp8/edit?usp=sharing) |

---

## Screenshots

### Desktop

<div align="center">

| Main Dashboard | Register Product |
|---|---|
| ![Dashboard](Screen%20Recordings/Screenshot%202026-04-23%20015532.png) | ![Register](Screen%20Recordings/Screenshot%202026-04-23%20015553.png) |

| Verify Product | Genuine Result |
|---|---|
| ![Verify](Screen%20Recordings/Screenshot%202026-04-23%20015718.png) | ![Genuine](Screen%20Recordings/Screenshot%202026-04-23%20015848.png) |

| Transaction History | Latest Build |
|---|---|
| ![History](Screen%20Recordings/Screenshot%202026-04-23%20015907.png) | ![Build](Screen%20Recordings/Screenshot%202026-04-26%20054012.png) |

</div>

### Mobile

<div align="center">

| View 1 | View 2 | View 3 |
|---|---|---|
| ![m1](Screen%20Recordings/WhatsApp%20Image%202026-04-28%20at%201.46.10%20AM.jpeg) | ![m2](Screen%20Recordings/WhatsApp%20Image%202026-04-28%20at%201.46.10%20AM%20(1).jpeg) | ![m3](Screen%20Recordings/WhatsApp%20Image%202026-04-28%20at%201.46.10%20AM%20(2).jpeg) |

</div>

### Demo Video

<video width="100%" controls>
  <source src="Screen%20Recordings/20260430-0925-12.2390959.mp4" type="video/mp4">
</video>

> GitHub may not render the video inline. [Download here](Screen%20Recordings/20260430-0925-12.2390959.mp4) or clone the repo to watch locally.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     User (Browser)                  │
│  AuthPage → Login/Signup (Supabase)                 │
│  Seller: Register Product → Freighter Wallet Sign   │
│  Customer: Verify Product → Approve Product         │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │    React + Vite       │
         │  (Vercel Hosted)      │
         │                       │
         │  components/          │
         │  ├─ AuthPage          │
         │  ├─ Dashboard         │
         │  ├─ AddProduct        │
         │  ├─ VerifyProduct     │
         │  └─ TransactionHistory│
         │                       │
         │  utils/               │
         │  ├─ contract.js       │
         │  ├─ freighter.js      │
         │  ├─ indexer.js        │
         │  └─ auth.js           │
         └──────┬────────┬───────┘
                │        │
    ┌───────────▼──┐  ┌──▼──────────────┐
    │   Supabase   │  │  Stellar Testnet │
    │  (User DB)   │  │  Soroban Contract│
    │  30+ users   │  │  Products stored │
    └──────────────┘  └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust · Soroban SDK 21.x |
| Blockchain | Stellar Testnet |
| Frontend | React 18 · Vite 5 |
| Wallet | Freighter Extension (v3 API) |
| User Database | Supabase (Postgres) |
| CI/CD | GitHub Actions + Vercel |

### Contract Functions

| Function | Type | Description |
|---|---|---|
| `add_product(manufacturer, name, brand)` | Write | Register product, returns ID |
| `approve_product(approver, product_id)` | Write | Add approval; auto-verifies at 2 |
| `get_product(id)` | Read | Fetch product with approval status |
| `verify_product(id)` | Read | Returns `true` if product exists |
| `get_product_count()` | Read | Total registered products |

### Security

| Layer | Implementation |
|---|---|
| Contract auth | `require_auth()` on every write function |
| Duplicate approvals | Contract panics with `"Already approved"` |
| Input validation | Empty field checks, numeric ID validation, maxLength |
| Network guard | UI warns if Freighter is on Mainnet |
| Error handling | All RPC calls wrapped in try/catch — no raw errors shown |

### Data Flow

```
Seller registers product
        ↓
Freighter wallet popup → user signs
        ↓
Transaction submitted to Stellar Testnet
        ↓
Product stored on-chain with ID
        ↓
Buyer enters Product ID → verify
        ↓
Community approves (2 wallets needed)
        ↓
Product marked "Verified by Network ✅"
```

---

## CI/CD Pipeline

### GitHub Actions — CI (`ci.yml`)
Runs on every push and pull request to `main`.
```
push / PR  →  checkout  →  Node 20  →  npm ci  →  npm run build  →  upload dist/
```

### Vercel Deployment
Automatic deployment via Vercel Git integration.
```
push to main  →  Vercel detects change  →  build frontend  →  deploy to production
```

### Vercel Configuration (`vercel.json`)
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**To deploy to Vercel:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import this repository
3. Add environment variables: `VITE_CONTRACT_ID`, `VITE_RPC_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy

---

## Deployed Contract

| | |
|---|---|
| Network | Stellar Testnet |
| Contract ID | `CDRF3WAWOYS6YQFHLYE3PYIMURYMTV6NXSB4OUQISFTITYB2D3UB2U6J` |
| Explorer | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDRF3WAWOYS6YQFHLYE3PYIMURYMTV6NXSB4OUQISFTITYB2D3UB2U6J) |

---

## Project Structure

```
verifyX/
├── .github/workflows/
│   └── ci.yml              # Build on every push/PR
├── contract/
│   └── src/lib.rs          # Soroban smart contract
├── frontend/
│   ├── src/
│   │   ├── components/     # AuthPage, Dashboard, AddProduct, VerifyProduct…
│   │   ├── utils/          # contract.js, freighter.js, indexer.js, auth.js
│   │   └── styles/App.css
│   ├── .env.example
│   └── package.json
├── Screen Recordings/      # Screenshots + demo video
└── vercel.json             # Vercel deployment config
```

---

## Quick Start

```bash
git clone https://github.com/kunalsathe18/verifyX
cd verifyX/frontend
npm install
cp .env.example .env   # fill in contract ID + Supabase keys
npm run dev            # → http://localhost:5173
```

**Environment variables:**

| Variable | Description |
|---|---|
| `VITE_CONTRACT_ID` | Deployed Soroban contract ID |
| `VITE_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

---

## User Research & Feedback

**Full responses (30+ users):** [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1yzMdzSmkJxzERzZM6oYzkIceyxxSDrCyXWIHMFHjkp8/edit?usp=sharing)

### Table 1 — Registered Users (Sample of 5)

| User Name | User Email | Wallet Address |
|---|---|---|
| Vishvajit Bhagave | vishvajitbhagave@gmail.com | `GCFBFO5ISC2JJVBXDU5GCSE73OYE7CUK4QKYBDUX4LKJQ7EH4TBDWOTR` |
| Tanmay Tad | tadtanmay3@gmail.com | `GAYJALSDDA3QYIIQDFESHZCHNKGWV43C76Y2MSL6MZS6RCGO7YO3HTMQ` |
| Sarthak Dhere | Sarthakdhere0217@gmail.com | `GD5DAQGVZ5LB4DEIJXSFBAN5XDZ4S5ZI4LKY4PGTAMJ3COFH2OFHAPUF` |
| Nakul Gokave | nacoolg@gmail.com | `GCWTXNHHTV7IXIPBQKJSQEIUUNZEXJ2BJJITGQS2Z3FDTQBO6WOG3DF6` |
| Yash Kamble | yashkamble095@gmail.com | `GBOG3XA6F6PPIAYI5G53XIQQHLZLQMC7W6BSDXQWKNYW3X2CHSRPQ4HA` |

### Table 2 — User Feedback & Implementation

| User Name | User Email | Wallet Address | Feedback | Commit / Action |
|---|---|---|---|---|
| Vishvajit Bhagave | vishvajitbhagave@gmail.com | `GCFBFO5...WOTR` | Everything is okay. Rating: 5/5 | No changes needed |
| Tanmay Tad | tadtanmay3@gmail.com | `GAYJALS...TMQN` | No suggestion. Rating: 5/5 | No changes needed |
| Sarthak Dhere | Sarthakdhere0217@gmail.com | `GD5DAQ...APUF` | Nice application. Rating: 4/5 | UI polish applied |
| Nakul Gokave | nacoolg@gmail.com | `GCWTXN...DF6` | Already good. Rating: 4/5 | No changes needed |
| Yash Kamble | yashkamble095@gmail.com | `GBOG3X...Q4HA` | All good. Rating: 5/5 | No changes needed |
| Vedang Bahirat | vbahirat24@gmail.com | `GAYMWU...W4H` | Good Application!! Rating: 5/5 | No changes needed |
| Omkar Jagtap | omkarjagtap2105@gmail.com | `GAF57C...AFZ` | Nice work. Rating: 5/5 | No changes needed |
| Pranali Bahirat | bahirat.prananli22@gmail.com | `GAWOTM...GAK` | Good Work. Rating: 4/5 | Mobile layout improved |
| Vinayak Supekar | supekar.vina@gmail.com | `GA64YO...IVP` | Great work. Rating: 5/5 | No changes needed |

**Summary:** All 9 users rated 4–5 stars. UI/mobile improvements were applied based on 4-star feedback. Full 30+ responses in the [spreadsheet](https://docs.google.com/spreadsheets/d/1yzMdzSmkJxzERzZM6oYzkIceyxxSDrCyXWIHMFHjkp8/edit?usp=sharing).

---

## Links

| | |
|---|---|
| Live App | https://verify-x-seven.vercel.app |
| GitHub | https://github.com/kunalsathe18/verifyX |
| Contract | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDRF3WAWOYS6YQFHLYE3PYIMURYMTV6NXSB4OUQISFTITYB2D3UB2U6J) |
| User Feedback | [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1yzMdzSmkJxzERzZM6oYzkIceyxxSDrCyXWIHMFHjkp8/edit?usp=sharing) |

---

*Built with ❤️ on Stellar · MIT License*
