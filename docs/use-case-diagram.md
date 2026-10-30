# System Use-Case Diagram

```mermaid
graph LR
    subgraph Actors
        Admin["Administrator"]
        Supplier["Raw Material Supplier"]
        Manufacturer["Manufacturer"]
        Auditor["Independent Auditor"]
        Consumer["Public Consumer"]
    end

    subgraph SystemUseCases ["Traceability Platform Capabilities"]
        UC1["Manage Users & Roles"]
        UC2["Approve / Reject Supplier Accreditation"]
        UC3["Register Raw Material Batch"]
        UC4["Submit Sourcing Evidence & Upload Certs"]
        UC5["Record Processing / Transportation Event"]
        UC6["Transfer Digital Batch Custody"]
        UC7["Perform Batch Split or Merge"]
        UC8["Inspect Sourcing Claims & Run Cryptographic Audit"]
        UC9["Flag Suspicious Supply Chain Records"]
        UC10["Review & Verify Compliance Certificates"]
        UC11["Scan QR Code / Public Batch Verification"]
        UC12["Inspect On-Chain Ledger & Blockchain Tx"]
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC8
    Admin --> UC10
    Admin --> UC12

    Supplier --> UC3
    Supplier --> UC4
    Supplier --> UC5
    Supplier --> UC6

    Manufacturer --> UC5
    Manufacturer --> UC6
    Manufacturer --> UC7

    Auditor --> UC8
    Auditor --> UC9
    Auditor --> UC10
    Auditor --> UC12

    Consumer --> UC11
```

### Role Authorization Summary:
- **Administrator**: Approves suppliers, manages users, reviews system audit logs, and monitors ledger health.
- **Supplier**: Registers extraction batches with GPS coordinates, submits compliance certificates, appends initial events, and transfers custody.
- **Manufacturer**: Receives custody of batches, records processing and manufacturing events, splits batches into sub-lots, and merges input batches.
- **Auditor**: Reviews certificate validity, reviews supply chain event integrity, inspects smart contract hashes, and appends non-repudiable audit flags.
- **Consumer**: Scans QR codes without requiring login; accesses public provenance timelines, accredited certificate statuses, and fraud warnings.
