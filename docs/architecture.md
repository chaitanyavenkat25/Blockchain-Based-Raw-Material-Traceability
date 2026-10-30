# System Architecture: Blockchain-Based Responsible Raw Material Traceability System

## 1. High-Level Architectural Model

The system follows a hybrid off-chain/on-chain architecture designed to overcome the classical storage and throughput limitations of public/private distributed ledgers while guaranteeing cryptographic non-repudiation and tamper evidence.

```mermaid
graph TD
    subgraph ClientLayer ["1. Client Layer (Presentation)"]
        BrowserUI["React 18 + Vite Web App"]
        QRScanner["Web-Based Camera & QR Reader"]
        PublicPortal["Public Consumer Verification Portal"]
    end

    subgraph APILayer ["2. Application Layer (Node.js + Express + TypeScript)"]
        REST["REST API Controllers & Route Handlers"]
        AuthRBAC["JWT Auth & Role-Based Authorization Engine"]
        ZodValidator["Zod Request Schema Validation"]
        CanonicalEngine["Canonical JSON Serializer & SHA-256 Engine"]
        TamperService["Tamper-Audit Service (Recalculation & Diff)"]
        BlockchainSvc["Blockchain Service (Ethers.js v6)"]
        FileStorage["Multer Storage (Hashed PDF/Images)"]
    end

    subgraph StorageLayer ["3. Off-Chain Database Layer (MongoDB)"]
        UsersCol["Users & Supplier Profiles"]
        BatchesCol["Material Batches & Metadata"]
        EventsCol["Append-Only Traceability Events"]
        CertsCol["Certificates & Sourcing Claims"]
        GenealogyCol["Genealogy Records (Split/Merge)"]
        AuditCol["Audit Logs & Tamper Alerts"]
    end

    subgraph LedgerLayer ["4. Decentralized Ledger Layer (EVM / Hardhat)"]
        SmartContract["RawMaterialTraceability.sol (EVM Contract)"]
        BatchRegistry["Batch Records & Custody State"]
        EventHashes["Cryptographic Event Hash Chain (prevHash Linkage)"]
        DocHashes["Document Hashes (SHA-256 Anchors)"]
        GenealogyLedger["Genealogy Links (Parent -> Child)"]
    end

    ClientLayer --> REST
    REST --> AuthRBAC
    REST --> ZodValidator
    ZodValidator --> CanonicalEngine
    CanonicalEngine --> EventsCol
    EventsCol --> TamperService
    TamperService --> BlockchainSvc
    BlockchainSvc --> SmartContract
    SmartContract --> BatchRegistry
    SmartContract --> EventHashes
    SmartContract --> DocHashes
    SmartContract --> GenealogyLedger
    REST --> FileStorage
    REST --> UsersCol
    REST --> BatchesCol
    REST --> CertsCol
    REST --> GenealogyCol
    REST --> AuditCol
```

---

## 2. Off-Chain vs. On-Chain Design Tradeoffs

| Concern | Off-Chain (MongoDB + File Storage) | On-Chain (Solidity Smart Contract) |
| :--- | :--- | :--- |
| **Data Stored** | Full business entities, supplier coordinates, descriptions, notes, original PDF documents. | Canonical event hashes (`bytes32`), initial batch metadata, custodian addresses, document hashes. |
| **Privacy & GDPR** | Personal emails, confidential agreements, and contact details can be modified or purged under legal mandate. | Zero PII or confidential commercial data; only immutable mathematical proofs. |
| **Gas & Cost** | Zero gas fees; sub-millisecond query execution. | Minimal gas overhead (storing single 32-byte hashes instead of text blobs). |
| **Integrity Model** | Subject to potential silent database modification by compromised DBAs or attackers. | Immutable ledger; append-only; mathematically impossible to forge without private keys. |
| **Audit Verification** | Provides the raw content to re-serialize and compare against the on-chain anchor. | Acts as the definitive mathematical ground truth for detecting database tampering. |

---

## 3. Cryptographic Hash Chain Structure

Every traceability event includes the hash of the preceding event, forming an append-only linear chain analogous to a blockchain block header:

```mermaid
graph LR
    subgraph Event0 ["Event #0 (Extraction)"]
        D0["Canonical JSON 0"]
        H0["Hash 0: 0x4a7e..."]
        P0["Prev Hash: 0x0000..."]
        D0 --> H0
    end

    subgraph Event1 ["Event #1 (Inspection)"]
        D1["Canonical JSON 1"]
        H1["Hash 1: 0x8e12..."]
        P1["Prev Hash: 0x4a7e..."]
        D1 --> H1
    end

    subgraph Event2 ["Event #2 (Transport)"]
        D2["Canonical JSON 2"]
        H2["Hash 2: 0x3f5c..."]
        P2["Prev Hash: 0x8e12..."]
        D2 --> H2
    end

    H0 --> P1
    H1 --> P2
```

If an attacker alters `Event #0` in the database:
1. `Hash 0` recalculated from the altered data will no longer equal `0x4a7e...`.
2. Even if the attacker recalculates `Hash 0`, `Event #1`'s recorded `Prev Hash` will not match.
3. Even if the attacker updates `Event #1`, the on-chain smart contract anchor will immediately expose the tampering!
