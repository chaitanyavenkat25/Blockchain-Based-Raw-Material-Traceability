import { expect } from "chai";
import { ethers } from "hardhat";
import { RawMaterialTraceability } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RawMaterialTraceability Smart Contract", () => {
  let contract: RawMaterialTraceability;
  let admin: HardhatEthersSigner;
  let supplier: HardhatEthersSigner;
  let manufacturer: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const sampleBatchId = "BATCH-LITH-2026-001";
  const initialHash = ethers.keccak256(ethers.toUtf8Bytes("canonical-initial-event-data"));
  const secondHash = ethers.keccak256(ethers.toUtf8Bytes("canonical-second-event-data"));

  beforeEach(async () => {
    [admin, supplier, manufacturer, unauthorized] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("RawMaterialTraceability");
    contract = (await Factory.deploy(admin.address)) as RawMaterialTraceability;
    await contract.waitForDeployment();

    // Grant supplier RECORDER_ROLE
    const RECORDER_ROLE = await contract.RECORDER_ROLE();
    await contract.connect(admin).grantRole(RECORDER_ROLE, supplier.address);
  });

  describe("Deployment & Roles", () => {
    it("should assign DEFAULT_ADMIN_ROLE, RECORDER_ROLE, and AUDITOR_ROLE to admin", async () => {
      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      const recorderRole = await contract.RECORDER_ROLE();
      const auditorRole = await contract.AUDITOR_ROLE();

      expect(await contract.hasRole(adminRole, admin.address)).to.be.true;
      expect(await contract.hasRole(recorderRole, admin.address)).to.be.true;
      expect(await contract.hasRole(auditorRole, admin.address)).to.be.true;
    });

    it("should recognize granted RECORDER_ROLE for supplier", async () => {
      const recorderRole = await contract.RECORDER_ROLE();
      expect(await contract.hasRole(recorderRole, supplier.address)).to.be.true;
      expect(await contract.hasRole(recorderRole, unauthorized.address)).to.be.false;
    });
  });

  describe("Batch Registration", () => {
    it("should allow authorized recorder to register a batch", async () => {
      const tx = await contract.connect(supplier).registerBatch(
        sampleBatchId,
        "Mineral",
        "Battery-Grade Lithium Hydroxide",
        supplier.address,
        1000,
        "kg",
        initialHash
      );

      await expect(tx)
        .to.emit(contract, "BatchRegistered")
        .withArgs(
          sampleBatchId,
          "Mineral",
          "Battery-Grade Lithium Hydroxide",
          supplier.address,
          1000,
          "kg",
          initialHash,
          (ts: any) => typeof ts === "bigint" || typeof ts === "number"
        );

      const batch = await contract.getBatch(sampleBatchId);
      expect(batch.materialCategory).to.equal("Mineral");
      expect(batch.materialName).to.equal("Battery-Grade Lithium Hydroxide");
      expect(batch.supplier).to.equal(supplier.address);
      expect(batch.currentCustodian).to.equal(supplier.address);
      expect(batch.quantity).to.equal(1000n);
      expect(batch.unit).to.equal("kg");
      expect(batch.initialEventHash).to.equal(initialHash);
      expect(batch.exists).to.be.true;
    });

    it("should reject duplicate batch ID registration", async () => {
      await contract.connect(supplier).registerBatch(
        sampleBatchId,
        "Mineral",
        "Battery-Grade Lithium Hydroxide",
        supplier.address,
        1000,
        "kg",
        initialHash
      );

      await expect(
        contract.connect(supplier).registerBatch(
          sampleBatchId,
          "Mineral",
          "Duplicate Lithium",
          supplier.address,
          500,
          "kg",
          initialHash
        )
      ).to.be.revertedWith("Batch ID already registered");
    });

    it("should reject registration from unauthorized account", async () => {
      await expect(
        contract.connect(unauthorized).registerBatch(
          sampleBatchId,
          "Mineral",
          "Unauthorized Lithium",
          unauthorized.address,
          1000,
          "kg",
          initialHash
        )
      ).to.be.reverted;
    });

    it("should reject registration with zero quantity", async () => {
      await expect(
        contract.connect(supplier).registerBatch(
          sampleBatchId,
          "Mineral",
          "Lithium",
          supplier.address,
          0,
          "kg",
          initialHash
        )
      ).to.be.revertedWith("Quantity must be greater than zero");
    });
  });

  describe("Traceability Events & Linkage", () => {
    beforeEach(async () => {
      await contract.connect(supplier).registerBatch(
        sampleBatchId,
        "Mineral",
        "Battery-Grade Lithium Hydroxide",
        supplier.address,
        1000,
        "kg",
        initialHash
      );
    });

    it("should append a new event with valid previous event hash", async () => {
      const eventId = "EVT-TRANSIT-002";
      const eventType = "TRANSPORTATION";

      const tx = await contract.connect(supplier).recordEvent(
        sampleBatchId,
        eventId,
        eventType,
        secondHash,
        initialHash // previous event hash
      );

      await expect(tx)
        .to.emit(contract, "TraceabilityEventRecorded")
        .withArgs(
          sampleBatchId,
          eventId,
          eventType,
          secondHash,
          initialHash,
          supplier.address,
          (ts: any) => typeof ts === "bigint" || typeof ts === "number"
        );

      const count = await contract.getBatchEventsCount(sampleBatchId);
      expect(count).to.equal(2n);

      const evt = await contract.getTraceabilityEvent(sampleBatchId, 1);
      expect(evt.eventId).to.equal(eventId);
      expect(evt.eventType).to.equal(eventType);
      expect(evt.eventHash).to.equal(secondHash);
      expect(evt.prevEventHash).to.equal(initialHash);
      expect(evt.recorder).to.equal(supplier.address);
    });

    it("should reject appending an event with mismatched previous event hash", async () => {
      const wrongPrevHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-hash"));
      await expect(
        contract.connect(supplier).recordEvent(
          sampleBatchId,
          "EVT-TRANSIT-002",
          "TRANSPORTATION",
          secondHash,
          wrongPrevHash
        )
      ).to.be.revertedWith("Invalid previous event hash linkage");
    });

    it("should reject recording event for non-existent batch", async () => {
      await expect(
        contract.connect(supplier).recordEvent(
          "NON-EXISTENT-BATCH",
          "EVT-999",
          "TEST",
          secondHash,
          initialHash
        )
      ).to.be.revertedWith("Batch does not exist");
    });
  });

  describe("Hash Verification & Tamper Detection", () => {
    beforeEach(async () => {
      await contract.connect(supplier).registerBatch(
        sampleBatchId,
        "Mineral",
        "Battery-Grade Lithium Hydroxide",
        supplier.address,
        1000,
        "kg",
        initialHash
      );
    });

    it("should verify correct on-chain event hash", async () => {
      const [isValid, onChainHash, recorder, timestamp] = await contract.verifyEventHash(
        sampleBatchId,
        0,
        initialHash
      );

      expect(isValid).to.be.true;
      expect(onChainHash).to.equal(initialHash);
      expect(recorder).to.equal(supplier.address);
      expect(timestamp).to.be.greaterThan(0);
    });

    it("should fail verification if expected hash is altered (tampered)", async () => {
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-data"));
      const [isValid, onChainHash] = await contract.verifyEventHash(
        sampleBatchId,
        0,
        tamperedHash
      );

      expect(isValid).to.be.false;
      expect(onChainHash).to.equal(initialHash); // Shows original on-chain anchor
    });

    it("should return false for out-of-bounds event index", async () => {
      const [isValid] = await contract.verifyEventHash(sampleBatchId, 999, initialHash);
      expect(isValid).to.be.false;
    });
  });

  describe("Custody Transfer & Document Hashes", () => {
    beforeEach(async () => {
      await contract.connect(supplier).registerBatch(
        sampleBatchId,
        "Mineral",
        "Battery-Grade Lithium Hydroxide",
        supplier.address,
        1000,
        "kg",
        initialHash
      );
    });

    it("should allow current custodian to transfer custody", async () => {
      await expect(contract.connect(supplier).transferCustody(sampleBatchId, manufacturer.address))
        .to.emit(contract, "CustodyTransferred")
        .withArgs(sampleBatchId, supplier.address, manufacturer.address, (ts: any) => typeof ts === "bigint" || typeof ts === "number");

      const batch = await contract.getBatch(sampleBatchId);
      expect(batch.currentCustodian).to.equal(manufacturer.address);
    });

    it("should prevent unauthorized entity from transferring custody", async () => {
      await expect(
        contract.connect(unauthorized).transferCustody(sampleBatchId, manufacturer.address)
      ).to.be.revertedWith("Only admin or current custodian can transfer custody");
    });

    it("should anchor document hash and retrieve it", async () => {
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("ISO-14001-Certificate-PDF"));
      await contract.connect(supplier).anchorDocumentHash(sampleBatchId, docHash, "ISO 14001 Audit PDF");

      const hashes = await contract.getBatchDocumentHashes(sampleBatchId);
      expect(hashes.length).to.equal(1);
      expect(hashes[0]).to.equal(docHash);
    });

    it("should record genealogy relationship for split/merge", async () => {
      const childBatchId = "BATCH-LITH-2026-001-CHILD-A";
      await expect(
        contract.connect(supplier).recordGenealogy(sampleBatchId, childBatchId, "SPLIT")
      ).to.emit(contract, "GenealogyRecorded");
    });
  });
});
