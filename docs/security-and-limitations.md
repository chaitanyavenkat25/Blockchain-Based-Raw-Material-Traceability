# Security Model & Physical Oracle Limitations

An academic project must exhibit rigorous critical analysis regarding what blockchain guarantees, and what remains subject to physical-world constraints.

---

## 1. What Blockchain Mathematically Proves

1. **Tamper Evidence**: Once a canonical hash (SHA-256) is recorded on the EVM smart contract, no entity—including database administrators, cloud hosting providers, or software developers—can modify the historical off-chain event data without detection.
2. **Chronological Non-Repudiation**: Because each event records the hash of its preceding event (`prevEventHash`), events cannot be retroactively inserted, reordered, or deleted without invalidating the cryptographic chain.
3. **Identity & Authorization Non-Repudiation**: Smart contract write methods are guarded by OpenZeppelin `AccessControl`. Only authenticated private keys holding the `RECORDER_ROLE` or `DEFAULT_ADMIN_ROLE` can commit state changes.
4. **Document Integrity**: Comparing the SHA-256 hash of an uploaded PDF or image against the on-chain recorded document hash establishes with mathematical certainty whether the file is identical to the file originally certified.

---

## 2. What Blockchain CANNOT Prove (The Physical Oracle Problem)

A fundamental misconception in distributed ledger technology is that "blockchain proves truth." In physical supply chains, blockchain inherits the classical **Garbage-In, Garbage-Out (GIGO)** constraint:

1. **The Physical Oracle Gap**: A blockchain has no sensory capability to know if a shipping container labeled "Battery-Grade Lithium" actually contains high-purity lithium brine or plain seawater. The blockchain only proves that *Actor X recorded Claim Y at Timestamp Z*.
2. **Human Labor & Social Compliance**: An on-chain declaration that cotton was picked without child labor does not physically prevent labor exploitation at the farm level unless backed by independent physical inspections.
3. **Self-Reporting Bias**: Untrusted parties can submit fraudulent declarations.

---

## 3. How This System Mitigates the Physical Oracle Problem

To address these limitations, our platform implements a multi-tier trust model:

| Vulnerability | Architectural Safeguard |
| :--- | :--- |
| **False Supplier Claims** | Suppliers start in `PENDING_APPROVAL` status. Self-reported declarations are explicitly labeled **Unverified** in all public views until accredited third-party audit documents are submitted. |
| **Document Forgery** | Document hashes are linked to accredited certification bodies (e.g., IRMA, SGS, Fairtrade, ASI) with public registry numbers for independent verification. |
| **Silent Off-Chain Alteration** | The `TamperAuditService` continuously recalculates canonical JSON SHA-256 hashes against smart contract anchors, automatically raising **CRITICAL** tamper alerts upon any discrepancy. |
| **Material Substitution in Transit** | Container seal numbers and intermediate custody transfer handoffs require cryptographically signed receipts between the transferring custodian and receiving manufacturer. |
| **Genealogy Quantity Inflation** | Batch splitting and merging operations enforce strict mass-balance validation: the total quantity of child batches cannot exceed parent batch quantities without explicit documented adjustments. |

---

## 4. Privacy & GDPR Compliance

Storing complete business records, personal contact info, or trade secrets directly on a public blockchain ledger violates privacy laws (such as GDPR's "Right to be Forgotten") due to blockchain immutability. 

Our architecture strictly isolates:
- **Off-Chain (MongoDB)**: PII, user names, emails, raw PDF files. These can be redacted or anonymized if legally required.
- **On-Chain (Smart Contract)**: Pseudonymous Ethereum addresses, 32-byte cryptographic hashes, numerical quantities, and status flags. No personal data ever touches the distributed ledger.
