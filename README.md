# verifyX

A blockchain-based product authenticity verification platform built on Stellar. Sellers register products on-chain, buyers verify authenticity using unique Product IDs — no middlemen, no fakes.

**Live Demo:** [https://origincheck.netlify.app](https://origincheck.netlify.app)

---

## Screenshots

### Product Registration & Verification

<div align="center">

#### Main Dashboard
![Main Dashboard](Screen%20Recordings/Screenshot%202026-04-23%20015532.png)
*Product registration and verification interface*

#### Product Registration Success
![Product Registration Success](Screen%20Recordings/Screenshot%202026-04-23%20015553.png)
*Register a product on the blockchain and receive a unique Product ID*

#### Verify Product Authenticity
![Product Verification](Screen%20Recordings/Screenshot%202026-04-23%20015718.png)
*Verify product authenticity by entering the Product ID*

#### Genuine Product Details
![Genuine Product Details](Screen%20Recordings/Screenshot%202026-04-23%20015848.png)
*View complete product details including manufacturer address*

#### Transaction History Dashboard
![Transaction History](Screen%20Recordings/Screenshot%202026-04-23%20015907.png)
*Track all registered products with blockchain explorer links*

#### Complete Workflow
![Complete Workflow](Screen%20Recordings/Screenshot%202026-04-23%20015927.png)
*Full product registration and verification workflow*

</div>

### 🎥 Demo Video

Watch the complete product registration and verification process:

<video width="100%" controls>
  <source src="Screen%20Recordings/Screen%20Recording%202026-04-23%20030939.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

> **Note:** For GitHub, the video may not display directly. [Download the demo video](Screen%20Recordings/Screen%20Recording%202026-04-23%20030939.mp4) or watch it after cloning the repository.

---

## Features

✅ **Product Registration** — Register products on the blockchain with wallet signature  
✅ **Instant Verification** — Verify product authenticity using Product ID  
✅ **Transaction History** — View all registered products with blockchain explorer links  
✅ **Wallet Management** — Connect and disconnect Freighter wallet seamlessly  
✅ **Real-time Updates** — Automatic transaction tracking and status updates  
✅ **Mobile Responsive** — Optimized for all devices

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust · Soroban SDK 21.x |
| Blockchain | Stellar Testnet |
| Frontend | React 18 · Vite 5 |
| Wallet | Freighter Extension |
| Storage | LocalStorage (transaction history) |
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
│   ├── src/
│   │   └── lib.rs                      # Soroban smart contract
│   ├── Cargo.toml                      # Rust dependencies
│   └── Cargo.lock
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddProduct.jsx          # Product registration form
│   │   │   ├── VerifyProduct.jsx       # Product verification form
│   │   │   ├── TransactionHistory.jsx  # Transaction history display
│   │   │   ├── WalletConnect.jsx       # Wallet connection handler
│   │   │   ├── DisconnectModal.jsx     # Wallet disconnect modal
│   │   │   └── NetworkBanner.jsx       # Network warning banner
│   │   ├── utils/
│   │   │   ├── contract.js             # Soroban contract interactions
│   │   │   └── freighter.js            # Freighter wallet integration
│   │   ├── styles/
│   │   │   └── App.css                 # Global styles
│   │   ├── App.jsx                     # Main app component
│   │   └── main.jsx                    # Entry point
│   ├── public/
│   │   └── favicon.svg
│   ├── .env.example                    # Environment template
│   ├── .env                            # Environment variables (not committed)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── Screen Recordings/
│   ├── Screenshot *.png                # App screenshots (6 images)
│   └── Screen Recording *.mp4          # Demo video
│
├── .gitignore
├── netlify.toml                        # Netlify deployment config
└── README.md
```

---

## Quick Start

### Prerequisites

- **Rust** (latest stable)
- **Stellar CLI** v25+
- **Node.js** v18+
- **Freighter Wallet** (browser extension)

### Installation

```bash
# Clone the repository
git clone https://github.com/kunalsathe18/verifyX
cd verifyX

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your contract ID and RPC URL

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Contract Deployment

### Build the Contract

```bash
cd contract
stellar contract build
```

### Deploy to Testnet

```bash
# Generate and fund a testnet identity
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet

# Deploy the contract
stellar contract deploy \
  --wasm target/wasm32v1-none/release/verifyx.wasm \
  --source deployer \
  --network testnet

# Save the returned Contract ID to frontend/.env
```

### Update Frontend

```bash
# Edit frontend/.env
VITE_CONTRACT_ID=YOUR_NEW_CONTRACT_ID
VITE_RPC_URL=https://soroban-testnet.stellar.org:443
```

---

## CI/CD Pipeline

This project uses **Netlify's automated deployment** for continuous integration and delivery.

### Deployment Flow

```
Developer Push
      ↓
git push origin main
      ↓
Netlify Detects Changes
      ↓
Install Dependencies (npm install)
      ↓
Build Frontend (npm run build)
      ↓
Run Tests & Checks
      ↓
Deploy to Production
      ↓
Live at https://origincheck.netlify.app ✅
```

### Configuration

- **Build Command:** `npm run build`
- **Build Directory:** `frontend/`
- **Publish Directory:** `frontend/dist`
- **Node Version:** 20.x
- **Environment Variables:** Managed in Netlify Dashboard
  - `VITE_CONTRACT_ID`
  - `VITE_RPC_URL`

### Deployment Settings

All deployment configuration is defined in `netlify.toml`:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Monitoring

- **Build Logs:** Available in Netlify dashboard under "Deploys" tab
- **Deploy Previews:** Automatic for pull requests
- **Rollback:** One-click rollback to previous deployments
- **Custom Domain:** Configured via Netlify DNS

### Security

- Environment variables are encrypted and never exposed in the repository
- HTTPS enabled by default with automatic SSL certificates
- Deploy previews are password-protected (optional)

---

## Development Notes

### Transaction Tracking
- Transaction history is stored in browser's localStorage
- Persists across page refreshes
- Limited to last 10 transactions
- Can be cleared manually via UI

### Wallet Connection
- Uses Freighter wallet extension
- Supports connect/disconnect functionality
- Address displayed in shortened format
- Network warning shown if on mainnet

### Error Handling
- Simulation errors handled gracefully
- Transaction polling with timeout (45s)
- User-friendly error messages
- Console logging for debugging

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_CONTRACT_ID` | Deployed Soroban contract ID | Required |
| `VITE_RPC_URL` | Stellar RPC endpoint | `https://soroban-testnet.stellar.org:443` |

Copy `frontend/.env.example` to `frontend/.env` for local development.

---

## Smart Contract Functions

The Soroban smart contract provides three main functions:

### `add_product(manufacturer: Address, name: String, brand: String) -> u64`
Registers a new product on the blockchain.
- **Parameters:** Manufacturer address, product name, brand
- **Returns:** Unique Product ID
- **Requires:** Wallet signature

### `get_product(id: u64) -> Product`
Retrieves product details by ID.
- **Parameters:** Product ID
- **Returns:** Product struct (id, name, brand, manufacturer)
- **Read-only:** No wallet required

### `verify_product(id: u64) -> bool`
Verifies if a product exists on-chain.
- **Parameters:** Product ID
- **Returns:** `true` if genuine, `false` if not found
- **Read-only:** No wallet required

---

## How It Works

### For Sellers (Product Registration)

1. **Connect Wallet** — Click "Connect Freighter Wallet" in the header
2. **Fill Product Details** — Enter product name and brand
3. **Register On-Chain** — Sign the transaction with your wallet
4. **Get Product ID** — Receive a unique ID to share with buyers
5. **Track History** — View all registered products in the transaction history

### For Buyers (Product Verification)

1. **Enter Product ID** — Input the ID received from the seller
2. **Verify** — Click "Verify Product" to check authenticity
3. **View Results** — See product details and manufacturer address
4. **Blockchain Proof** — Genuine products show ✅, fake/unregistered show ❌

### Transaction History

- Displays last 10 registered products
- Shows Product ID, name, brand, and timestamp
- Direct links to Stellar Explorer for blockchain verification
- Stored locally in browser (persists across sessions)
- Clear history option available

---

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Brave
- Any browser with Freighter extension support

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - feel free to use this project for learning or commercial purposes.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/kunalsathe18/verifyX/issues)
- **Stellar Docs:** [Soroban Documentation](https://soroban.stellar.org)
- **Freighter Wallet:** [Freighter Docs](https://www.freighter.app)

---

**Built with ❤️ on Stellar**
