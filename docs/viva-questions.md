# Academic Viva Defense Questions & Answers

This guide prepares students for academic reviews, project examinations, and defense questions regarding the **Blockchain-Based Responsible Raw Material Traceability System**.

---

### Q1: Why use blockchain for supply chain traceability instead of a centralized database?
**Answer:** A centralized database (like MySQL or MongoDB alone) is mutable by design. Any database administrator (DBA), cloud provider employee, or attacker with compromised credentials can silently update records—such as retroactively altering material quantities, changing mine coordinates, or erasing inspection failures—leaving no cryptographic evidence of the modification. Blockchain provides an immutable, decentralized ledger where event hashes cannot be altered or deleted. Combining off-chain storage with on-chain cryptographic anchoring gives the best of both worlds: high database performance and absolute tamper evidence.

---

### Q2: Why not store all the raw material data and uploaded certificates directly on the blockchain?
**Answer:** Storing large volumes of unstructured data (such as PDFs, high-resolution imagery, and verbose supplier profiles) directly on an EVM blockchain is cost-prohibitive in gas fees and causes severe state bloat across validating nodes. Furthermore, storing Personally Identifiable Information (PII) on an immutable ledger violates privacy regulations such as GDPR (the "Right to be Forgotten"). Our architecture stores the detailed business entities off-chain in MongoDB, while storing only deterministic 32-byte SHA-256 hashes and event linkage on-chain.

---

### Q3: What is the "Physical Oracle Problem" in blockchain supply chain tracking, and how does your project address it?
**Answer:** The Physical Oracle Problem states that while a blockchain guarantees that digital data has not been altered since it was recorded, it cannot physically guarantee that the real-world material matches the digital description (the "garbage-in, garbage-out" problem). Our system addresses this by:
1. Clearly distinguishing between self-reported supplier claims and independently verified audit evidence.
2. Requiring accredited third-party certification bodies (e.g., IRMA, SGS, Fairtrade) before claims are labeled "Verified."
3. Enforcing physical custody transfer receipts between suppliers, transporters, and manufacturers.
4. Validating mass-balance conservation during batch splitting and merging to prevent phantom material creation.

---

### Q4: How does your canonical hashing algorithm work, and why is canonical serialization necessary?
**Answer:** In JavaScript and JSON, object keys do not have a guaranteed order (`{"a":1, "b":2}` vs `{"b":2, "a":1}`). Standard JSON stringification produces different character strings for the same semantic object, which produces completely different SHA-256 hashes. Our `canonicalJsonStringify` utility sorts object keys alphabetically at all nesting levels, strips extraneous whitespace, and serializes consistently. This ensures that whenever the system recalculates the hash of an event from the database, the resulting SHA-256 matches the original on-chain anchor exactly.

---

### Q5: How does your tamper-detection demonstration work?
**Answer:** The system features a dedicated academic demonstration route (`/api/batches/:id/simulate-tamper`) that alters a field in MongoDB (e.g., changing quantity from 10,000 kg to 99,999 kg) without modifying the on-chain smart contract. When the user or examiner triggers "Run Cryptographic Audit", the `TamperAuditService` re-serializes the MongoDB record into canonical JSON, recalculates the SHA-256 hash, and compares it against both the stored database hash and the smart contract's `verifyEventHash` function. The hash mismatch is immediately detected, a CRITICAL audit alert is logged, and the batch is flagged in red.

---

### Q6: What smart contract standards or libraries did you utilize in `RawMaterialTraceability.sol`?
**Answer:** We utilized OpenZeppelin v5's `AccessControl` framework. This allows fine-grained role-based permissioning:
- `DEFAULT_ADMIN_ROLE`: Contract owner capable of assigning roles and registering entities.
- `RECORDER_ROLE`: Granted to accredited suppliers and manufacturers to commit batch registrations and traceability events.
- `AUDITOR_ROLE`: Granted to independent auditors to record compliance reviews and audit findings.

---

### Q7: Explain the batch genealogy model for splitting and merging.
**Answer:** In modern manufacturing, raw materials are rarely processed in single contiguous units. A 10,000 kg batch of lithium brine may be split into two 5,000 kg refinery allocations, or multiple smaller recycled copper lots may be merged into a single furnace melt. Our genealogy system records parent-child linkages in MongoDB and registers the transformation on-chain via `recordGenealogy(parentBatchId, childBatchId, operationType)`. The backend enforces that the sum of child batch quantities does not exceed the parent quantity.

---

### Q8: How is the QR code generated, and what information does a consumer see upon scanning it?
**Answer:** For every registered batch, a QR code containing the URL `http://localhost:5173/public/verify/:batchId` is dynamically generated. When a consumer scans the QR code with their mobile device, it opens a public verification page that requires no login. The page displays the material category, country/region of origin, supplier accreditation status, complete public event timeline, and verified sustainability certificates, while withholding confidential supplier contracts, prices, or personal contact details.

---

### Q9: What happens if the blockchain local node is temporarily offline?
**Answer:** The backend's `BlockchainService` is designed with high fault tolerance. If the local EVM node is offline or unreachable, the system does not crash or fabricate false transaction hashes. Instead, it records events in MongoDB with `blockchainStatus: 'OFFLINE'` or `'PENDING'`, allowing normal warehouse operations to continue while logging an advisory notice until the blockchain node reconnects.

---

### Q10: What future improvements could be added to this project?
**Answer:**
1. Integration with physical IoT sensors (temperature, GPS tracking transponders, and automated weighbridge scales) for automated data ingestion.
2. Migration from a local Hardhat EVM to an Ethereum Layer 2 roll-up (such as Polygon or Arbitrum) for zero-knowledge privacy proofs (zk-SNARKs).
3. Decentralized identity (W3C DIDs and Verifiable Credentials) for cryptographic supplier authentication.
