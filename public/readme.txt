================================================================================
ASSETNEXACHAIN INSTITUTIONAL REAL-WORLD ASSET (RWA) TOKENIZATION PROTOCOL
================================================================================

1. PROJECT OVERVIEW
--------------------------------------------------------------------------------
AssetNexaChain is an enterprise-grade Real-World Asset (RWA) tokenization and 
secondary liquidity protocol built on the ERC-3643 standard for Ethereum/BNB Chain 
and EVM-compatible ecosystems. 

The protocol bridges multi-million dollar real-world physical and financial assets
(Commercial Real Estate, Solar & Clean Tech Infrastructure, Private Credit Facilities,
Green Data Centers, and Farmland) into regulatory-compliant, liquid, fractional 
on-chain securities backed by legally binding Special Purpose Vehicle (SPV) trust 
structures.

Core Value Propositions:
- Regulatory Compliant (ERC-3643 Permissioned Token Standard)
- Identity & KYC Whitelisting Engine (On-Chain Transfer Hooks)
- Immutable Maximum Supply Caps & Dual-Valuation Timelock Oracle
- Non-Custodial Secondary Peer-to-Peer Order Book with Escrow
- Snapshot-Based Pro-Rata Yield & Rental Dividend Distribution
- Institutional SPV Legal Custody & IPFS Prospectus Verification


2. REPOSITORY & DIRECTORY ARCHITECTURE
--------------------------------------------------------------------------------
├── contracts/                    # Production Solidity 0.8.28 Smart Contracts
│   ├── AssetNexaCompliance.sol   # KYC/AML, Accredited Status, Whitelist & Quotas
│   ├── AssetNexaRWA.sol          # ERC-3643 Token with Supply Cap & Snapshots
│   ├── AssetNexaFactory.sol      # Registry & Factory for deploying RWA contracts
│   ├── AssetNexaPayment.sol      # Primary offering subscription gateway (USDC)
│   ├── AssetNexaMarketplace.sol  # Non-custodial P2P secondary order book
│   ├── AssetNexaYield.sol        # Dividend snapshot & pro-rata claim engine
│   ├── AssetNexaPriceManager.sol # Valuation oracle with 24h timelock governance
│   └── mock/MockERC20.sol        # Test settlement token (USDC / USDT)
├── test/                         # Hardhat Automated Integration Test Suites
│   ├── AssetNexaProtocol.test.ts # Exhaustive unit & security tests (34 specs)
│   └── Integration.test.ts       # Full lifecycle end-to-end integration tests
├── scripts/                      # Deployment, verification & generation scripts
│   ├── deploy.ts                 # Production deployment script to BNB Chain
│   ├── verify.ts                 # Etherscan / BscScan contract verification
│   └── generate_whitepaper.ts    # Automated institutional Whitepaper PDF compiler
├── src/                          # Modern React 19 + TypeScript Web App
│   ├── components/               # Specialized Institutional Tabs & Modals
│   │   ├── Navbar.tsx            # Header, stats, role selector, quick actions
│   │   ├── ExplorerTab.tsx       # Primary offering catalog & quick investment
│   │   ├── ComplianceTab.tsx     # Identity registry & pre-flight simulation
│   │   ├── MarketplaceTab.tsx    # Secondary P2P liquidity order book
│   │   ├── YieldTab.tsx          # Dividend distribution & pro-rata claims
│   │   ├── GovernanceTab.tsx     # Timelock valuation oracle & approvals
│   │   ├── IssuerStudioTab.tsx   # Asset tokenizer & factory deployer wizard
│   │   ├── AssetDetailModal.tsx  # Deep prospectus, SPV data & investment calc
│   │   ├── ContractTerminalModal.tsx # Live ABI interface & bytecode inspector
│   │   └── PortfolioModal.tsx    # Investor NAV & holding position inspector
│   ├── data/mockAssets.ts        # Initialized verified assets, profiles & data
│   ├── types.ts                  # Shared TypeScript interfaces & models
│   ├── App.tsx                   # Master protocol state machine & event handlers
│   └── main.tsx                  # React DOM entry point
├── public/                       # Static assets, logos & whitepaper.pdf
├── hardhat.config.cjs            # Hardhat EVM compiler & network configuration
├── vite.config.ts                # Vite frontend bundler with Tailwind CSS v4
├── readme.txt                    # This build, test, and run manual
└── whitepaper.pdf                # Institutional technical whitepaper document


3. PREREQUISITES & ENVIRONMENT SETUP
--------------------------------------------------------------------------------
Ensure you have the following installed on your machine:
- Node.js (v18.18.0 or v20.x or higher recommended)
- npm (v9.x or v10.x) or yarn or pnpm
- Git

Clone the repository and install all dependencies:
  $ git clone <repository-url>
  $ cd assetnexachain
  $ npm install


4. HOW TO COMPILE SMART CONTRACTS
--------------------------------------------------------------------------------
AssetNexaChain utilizes Hardhat with the Solidity 0.8.28 compiler and 200 runs 
optimizer enabled.

To compile all smart contracts and generate ABI artifacts & TypeChain typings:
  $ npm run compile
  # OR
  $ npx hardhat compile

Output:
  - Compiled 9 Solidity files successfully
  - Artifacts written to /artifacts/contracts/
  - Cache written to /cache/


5. HOW TO RUN TESTS (34 TEST SUITES)
--------------------------------------------------------------------------------
The test suite validates compliance hooks, transfer blocks, unauthorized claims,
reentrancy defense, timelock queue periods, secondary escrow, and dividend math.

To run all automated test suites on the local Hardhat EVM:
  $ npm test
  # OR
  $ npx hardhat test

To run specific integration tests:
  $ npm run test:integration

Expected Test Coverage Output:
  ✔ AssetNexaCompliance - Should initialize with default whitelisted jurisdictions (SG, US, DE, IN, UK, JP)
  ✔ AssetNexaCompliance - Should reject unverified investors from investing
  ✔ AssetNexaCompliance - Should enforce investment quotas per investor limit
  ✔ AssetNexaCompliance - Should block transfers from sanctioned/frozen addresses
  ✔ AssetNexaRWA - Should enforce immutable maximum supply cap
  ✔ AssetNexaRWA - Should execute snapshot and record historical balances
  ✔ AssetNexaPayment - Should accept USDC and mint fractional RWA units
  ✔ AssetNexaPayment - Should disburse primary funds to issuer SPV escrow
  ✔ AssetNexaMarketplace - Should escrow tokens on sell order creation
  ✔ AssetNexaMarketplace - Should execute atomic settlement with 1% protocol fee
  ✔ AssetNexaMarketplace - Should allow seller to cancel order and reclaim tokens
  ✔ AssetNexaYield - Should calculate exact pro-rata dividend based on snapshot
  ✔ AssetNexaYield - Should prevent double-claiming of dividends
  ✔ AssetNexaPriceManager - Should submit price proposal and queue in timelock
  ✔ AssetNexaPriceManager - Should require Compliance Officer dual signature
  ✔ AssetNexaPriceManager - Should execute price update after timelock maturity
  ... 34 passing (2.8s)


6. HOW TO RUN THE APPLICATION (FRONTEND & DEV SERVER)
--------------------------------------------------------------------------------
To start the Vite development server with Hot Reload on port 3000:
  $ npm run dev

Access the application in your browser at:
  http://localhost:3000

The web interface connects to the smart contracts, providing:
  - Asset Explorer (Primary subscriptions, target APYs, SPV legal documents)
  - Compliance Command Center (Manage KYC, whitelist, limits, pre-flight simulation)
  - Secondary Liquidity Market (P2P decentralized order book)
  - Yield Distribution Vault (Claim proportional rental cashflows)
  - Governance Timelock Oracle (Dual-signature price proposals)
  - Issuer Studio (Deploy new tokenized assets to factory)
  - Real-Time Role Switcher (Switch between 5 institutional personas in 1 click)
  - Smart Contract ABI Terminal (Inspect deployed contract bytecode & signatures)


7. HOW TO BUILD FOR PRODUCTION
--------------------------------------------------------------------------------
To generate optimized production static assets:
  $ npm run build

To preview the production build locally:
  $ npm run preview


8. HOW TO DEPLOY SMART CONTRACTS TO NETWORKS
--------------------------------------------------------------------------------
A. Localhost Hardhat Node:
  1. Start local node:
     $ npx hardhat node
  2. Run deploy script:
     $ npm run deploy:local

B. BNB Chain Testnet (Chain ID: 97):
  1. Configure your private key and RPC URL in .env:
     PRIVATE_KEY=0x...
     BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
     BSCSCAN_API_KEY=...
  2. Execute deployment:
     $ npm run deploy:bnb-testnet
  3. Verify contracts on BscScan:
     $ npm run verify:bnb-testnet


9. SECURITY INVARIANTS & AUDIT HIGHLIGHTS
--------------------------------------------------------------------------------
1. Zero-Unpermissioned Transfers: Every ERC-20 transfer in AssetNexaRWA invokes 
   `AssetNexaCompliance.canTransfer(from, to, amount)`. If either party fails KYC, 
   is non-accredited when required, or resides in a non-whitelisted jurisdiction, 
   the transaction reverts automatically.
2. Supply Cap Invariance: `totalSupplyCap` is stored as an immutable state variable. 
   Minting functions strictly revert if `totalSupply + amount > totalSupplyCap`.
3. Snapshot Pro-Rata Math: Dividend claims check `balanceOfAt(account, snapshotId)` 
   to eliminate flash-loan dividend exploits.
4. Timelocked Oracle Upgrades: Asset NAV revaluations cannot be executed unilaterally; 
   they require an on-chain IPFS appraisal document, a dual signature from a 
   `COMPLIANCE_ROLE` holder, and a 24-hour timelock delay.


10. WHITEPAPER REFERENCE
--------------------------------------------------------------------------------
For a full mathematical, architectural, and legal breakdown of the protocol, please 
refer to `whitepaper.pdf` located in the root directory and downloadable from 
the application header.

================================================================================
AssetNexaChain Protocol © 2026. All rights reserved.
================================================================================
