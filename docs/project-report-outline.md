# Final-Year Academic Project Report Outline

**Project Title:** Blockchain-Based Responsible Raw Material Traceability System  
**Degree / Course:** Bachelor of Technology / Master of Science in Computer Science & Engineering  

---

## Abstract
Brief summary (250–300 words) defining the problem of greenwashing and opaque mineral/agricultural supply chains, the hybrid off-chain/on-chain architectural solution, canonical SHA-256 event serialization, OpenZeppelin role-based smart contracts on EVM, empirical tamper-detection results, and public consumer QR code verification.

---

## Chapter 1: Introduction
1.1 Background & Motivation  
1.2 Problem Statement: Supply Chain Opacity & Greenwashing  
1.3 Research Objectives  
1.4 Scope and Delimitations  
1.5 Organization of the Dissertation  

---

## Chapter 2: Literature Review & Related Work
2.1 Traditional Supply Chain Management Systems (ERP/EDI)  
2.2 Blockchain Technology: Fundamentals, EVM, Consensus Mechanisms  
2.3 Blockchain in Provenance Tracking (Hyperledger Fabric vs Public EVM)  
2.4 The Physical Oracle Problem in Real-World Asset Tracking  
2.5 Regulatory Frameworks: EU Critical Raw Materials Act & OECD Due Diligence  

---

## Chapter 3: System Requirements & Architecture
3.1 Stakeholder Analysis & User Roles (Admin, Supplier, Manufacturer, Auditor, Consumer)  
3.2 Functional Requirements (FRs)  
3.3 Non-Functional Requirements (Performance, Security, Privacy, Gas Efficiency)  
3.4 Hybrid Off-Chain/On-Chain Architecture Design  
3.5 Cryptographic Hash-Chain Specifications & Canonical Normalization  

---

## Chapter 4: System Design & Implementation
4.1 Smart Contract Layer: `RawMaterialTraceability.sol`  
  - 4.1.1 AccessControl & Role Distribution  
  - 4.1.2 Batch Registration & Cryptographic Event Anchoring  
  - 4.1.3 Custody Transfers & Mass-Balance Genealogy  
4.2 Backend Layer: Express.js & TypeScript  
  - 4.2.1 Canonical Serialization Engine  
  - 4.2.2 Tamper-Audit Verification Engine  
  - 4.2.3 Document Hashing & Storage Subsystem  
4.3 Frontend Layer: React 18, Vite, Tailwind CSS, & Recharts  
  - 4.3.1 Role-Specific Dashboards  
  - 4.3.2 Append-Only Supply Chain Journey Timelines  
  - 4.3.3 QR Generation & Camera-Based Public Scanner  
  - 4.3.4 Batch Genealogy Graph Visualization  

---

## Chapter 5: Security Analysis & Fraud Detection
5.1 Threat Modeling (STRIDE Analysis)  
5.2 The Off-Chain Database Tampering Experiment  
5.3 Evaluation of the Physical Oracle Problem & Proposed Safeguards  
5.4 GDPR Compliance & Pseudonymous Cryptographic Identity  

---

## Chapter 6: Testing, Results & Discussion
6.1 Smart Contract Unit Testing (Hardhat & Chai: 16 Test Cases Passed)  
6.2 Backend API Integration Testing (Vitest & Supertest: 11 Endpoints Verified)  
6.3 Performance Benchmarks: Hash Recalculation Overhead & Gas Consumption  
6.4 Usability & Public Consumer Verification Evaluation  

---

## Chapter 7: Conclusion & Future Enhancements
7.1 Summary of Contributions  
7.2 Limitations of the Prototype  
7.3 Future Enhancements (IoT Sensor Integration, Zero-Knowledge Proofs, Layer-2 Rollups)  

---

## References
[Standard IEEE / ACM citations for blockchain, supply chain, and cryptography papers]
