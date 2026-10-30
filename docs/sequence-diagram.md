# Sequence Diagram: Batch Registration, Hashing, Anchoring, & QR Verification

This sequence illustrates the end-to-end cryptographic flow from supplier registration to public consumer verification.

```mermaid
sequenceDiagram
    autonumber
    actor Supplier as Supplier
    participant Frontend as React Frontend
    participant Backend as Express API
    participant Hashing as Canonical Hashing Engine
    participant MongoDB as MongoDB Database
    participant Contract as EVM Smart Contract
    actor Consumer as Public Consumer

    %% Step 1: Batch Registration
    Supplier->>Frontend: Enter Batch details, origin, & declarations
    Frontend->>Backend: POST /api/batches (JWT Token)
    Backend->>Hashing: hashCanonicalEventData(canonicalRegData)
    Hashing-->>Backend: Canonical SHA-256 Hash (bytes32)
    Backend->>MongoDB: Insert Batch & Event #0 (Hash, Canonical JSON)
    Backend->>Contract: registerBatch(batchId, cat, name, qty, hash)
    Contract-->>Backend: TxReceipt (TxHash, BlockNumber)
    Backend->>MongoDB: Update Event #0 with BlockchainTxHash (CONFIRMED)
    Backend->>Frontend: Batch Created + QR Code Data URL
    Frontend-->>Supplier: Display Batch Dashboard & Printable QR Card

    %% Step 2: Event Addition
    Supplier->>Frontend: Append Transportation Event
    Frontend->>Backend: POST /api/batches/:id/events
    Backend->>MongoDB: Query Event #0 for PreviousEventHash
    MongoDB-->>Backend: Event #0 Hash
    Backend->>Hashing: hashCanonicalEventData(canonicalEventData with prevHash)
    Hashing-->>Backend: Event #1 SHA-256 Hash
    Backend->>MongoDB: Save Event #1
    Backend->>Contract: recordEvent(batchId, eventId, type, hash, prevHash)
    Contract-->>Backend: TxReceipt
    Backend->>MongoDB: Update Event #1 with Blockchain Tx

    %% Step 3: Consumer QR Verification
    Consumer->>Frontend: Scan QR Code on Packaging
    Frontend->>Backend: GET /api/public/batches/:batchId
    Backend->>MongoDB: Query Batch, Events, & Certificates
    Backend->>Hashing: Recalculate Canonical Hashes for All Events
    Backend->>Contract: verifyEventHash(batchId, index, hash)
    Contract-->>Backend: Match: TRUE (On-Chain Hash Confirmed)
    Backend-->>Frontend: Sanitized Public Provenance Payload (INTACT)
    Frontend-->>Consumer: Render Verified Journey Timeline, Origin Map & Green Badge
```
