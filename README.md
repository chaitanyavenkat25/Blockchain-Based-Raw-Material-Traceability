# Blockchain-Based Responsible Raw Material Traceability System

A complete, production-grade academic full-stack platform that tracks raw materials (e.g., Lithium, Copper, Organic Cotton, Recycled Aluminum) from source extraction to final manufacturing. The system uses a hybrid architecture: off-chain detailed business records and certificate files are stored in MongoDB, while canonical SHA-256 event hashes and custody linkages are anchored into an EVM Solidity smart contract for immutable, tamper-evident verification.

---

## 1. Key Architectural Features

- **Hybrid Ledger Architecture**: MongoDB stores detailed business entities and uploaded certificate files; canonical SHA-256 hashes and event links are committed on-chain in `RawMaterialTraceability.sol`.
- **Deterministic Canonical Serialization**: A specialized JSON serializer sorts object keys alphabetically across all nesting levels, ensuring reproducible hashing.
- **Interactive Tamper-Evident Detection**: Recalculates event hashes against database records and queries the smart contract live. Features a simulation button to demonstrate detection of off-chain database tampering.
- **Batch Genealogy (Split & Merge)**: Supports mass-balance validation for batch division and aggregation with visual lineage graph rendering.
- **Dynamic QR Code Traceability**: Auto-generates high-error-correction QR codes for every batch, linking to a public, unauthenticated consumer verification portal.
- **Role-Based Access Control**: Strict backend and UI permissions across 5 distinct roles: Administrator, Raw Material Supplier, Manufacturer, Auditor, and Consumer.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons, Recharts, `html5-qrcode`, `qrcode.react`, React Router v6, Axios.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose (MongoDB), JWT Authentication, bcryptjs password hashing, Zod validation, Multer file upload, Ethers.js v6.
- **Blockchain**: Solidity 0.8.20, Hardhat development environment, OpenZeppelin v5 AccessControl contracts, Chai test framework.
- **Database**: MongoDB (Local port 27017 or MongoDB Atlas).

---

## 3. Quick Start & Execution Guide

### Prerequisites
- Node.js v18+ (tested on v24.16.0)
- MongoDB running locally on port `27017`

### Step 1: Install Dependencies
Open terminal in root directory `d:\projects\rawmaterial`:
```bash
# 1. Install blockchain dependencies
cd blockchain
npm install

# 2. Install backend dependencies
cd ../backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 2: Seed the Database with Realistic Demo Data
From the backend directory:
```bash
cd backend
npm run seed
```
*This populates realistic demo materials (Salar de Atacama Lithium, Katanga Copper, Gujarat Cotton, Heidelberg Recycled Aluminum), test accounts, compliance certificates, and append-only event histories.*

### Step 3: Start the Application Services

You can start the three services in separate terminal tabs:

**Terminal 1 — Blockchain Local Node (Optional, backend handles offline gracefully):**
```bash
cd blockchain
npx hardhat node
```
*(In a new tab, deploy the contract to the local node)*:
```bash
cd blockchain
npx hardhat run scripts/deploy.ts --network localhost
```

**Terminal 2 — Backend REST API:**
```bash
cd backend
npm run dev
```
*API will run at `http://localhost:5000` with MongoDB connected.*

**Terminal 3 — Frontend Web Application:**
```bash
cd frontend
npm run dev
```
*Frontend will run at `http://localhost:5173`.*

---

## 4. Pre-Seeded Demo Accounts (Click-to-Fill on Login)

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@traceability.org` | `Admin@12345` | Approve suppliers, review audit logs, system stats |
| **Supplier (Approved)** | `supplier@atacama-lithium.com` | `Supplier@12345` | Register batches, submit origin docs, transfer custody |
| **Supplier (Pending)** | `supplier@katanga-copper.com` | `Supplier@12345` | Demonstrates the supplier approval workflow |
| **Manufacturer** | `mfg@nexusev-battery.com` | `Mfg@12345` | Receive custody, perform batch splits/merges |
| **Auditor** | `auditor@sgs-sustainability.org` | `Auditor@12345` | Inspect claims, verify certificates, flag suspicious records |
| **Consumer** | `consumer@cleanenergy.org` | `Consumer@12345` | Public QR code verification portal (no login needed) |

---

## 5. Running Automated Tests

### 1. Smart Contract Unit Tests (Hardhat & Chai)
```bash
cd blockchain
npm test
```
*Runs 16 unit tests covering batch registration, duplicate rejection, role access control, previous-hash linkage, document anchoring, custody transfers, and hash verification.*

### 2. Backend REST API Integration Tests (Vitest & Supertest)
```bash
cd backend
npm test
```
*Runs 11 integration tests covering JWT auth, batch querying, event hash verification, public consumer verification, and dashboard analytics.*

### 3. Frontend Production Build Verification
```bash
cd frontend
npm run build
```
*Validates that all TypeScript types, React components, and Tailwind styles compile with zero errors.*

---

## 6. End-to-End Demonstration Workflow

1. **Admin Login**: Log in as `admin@traceability.org`. Navigate to **Suppliers** and approve the pending supplier (`Katanga Responsible Minerals Ltd`).
2. **Batch Registration**: Log in as `supplier@atacama-lithium.com`. Click **Register Batch**. Use the template button or enter custom details for Lithium Hydroxide.
3. **Submit Certificate**: Go to **Certificates**, upload a sustainability audit document (e.g. IRMA or ISO 14001). The system automatically computes its SHA-256.
4. **Auditor Review**: Log in as `auditor@sgs-sustainability.org`. Navigate to **Certificates**, click **Review Claim**, and approve it as **VERIFIED**.
5. **Supply Chain Events**: View the batch details, click **Append Event**, and record a **TRANSPORTATION** or **CUSTODY_TRANSFER** event to `Nexus EV Cell Manufacturing AB`.
6. **Batch Splitting**: Open **Genealogy Tree** for the batch and split it into sub-allocations.
7. **QR Code Verification**: Click **QR Code** on the batch card, open the public verification link (`/public/verify/:batchId`), and review the verified provenance timeline.
8. **Tamper-Detection Demo**: On the batch details page, click **Simulate Tamper**. Choose to modify the quantity in MongoDB. Then click **Run Cryptographic Audit**—the system detects the discrepancy against the on-chain anchor and flags the record in red.

---

## 7. Project Documentation

Comprehensive academic documentation is located in the `docs/` folder:
- [System Architecture](docs/architecture.md)
- [Use-Case Diagram](docs/use-case-diagram.md)
- [Database Schema & ER Diagram](docs/database-schema.md)
- [Sequence Diagram](docs/sequence-diagram.md)
- [REST API Documentation](docs/api-documentation.md)
- [Security & Physical Oracle Limitations](docs/security-and-limitations.md)
- [Viva Defense Questions & Answers](docs/viva-questions.md)
- [Project Report Outline](docs/project-report-outline.md)
