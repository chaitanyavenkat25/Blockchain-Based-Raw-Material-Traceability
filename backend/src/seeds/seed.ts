import mongoose from "mongoose";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { User } from "../models/User";
import { Supplier } from "../models/Supplier";
import { RawMaterial } from "../models/RawMaterial";
import { Batch } from "../models/Batch";
import { TraceabilityEvent } from "../models/TraceabilityEvent";
import { Certificate } from "../models/Certificate";
import { Genealogy } from "../models/Genealogy";
import { AuditLog } from "../models/AuditLog";
import { hashCanonicalEventData, sha256Bytes32 } from "../utils/canonicalHash";
import { blockchainService } from "../services/blockchainService";

async function seed() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB.");

    // Clear existing collections
    console.log("Clearing existing collections...");
    await Promise.all([
      User.deleteMany({}),
      Supplier.deleteMany({}),
      RawMaterial.deleteMany({}),
      Batch.deleteMany({}),
      TraceabilityEvent.deleteMany({}),
      Certificate.deleteMany({}),
      Genealogy.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log("Collections cleared.");

    // Create demo uploads directory and a mock certificate file
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }
    const sampleCertPath = path.join(config.uploadDir, "sample-irma-iso14001-cert.pdf");
    fs.writeFileSync(
      sampleCertPath,
      "%PDF-1.4 Mock Responsible Sourcing Certificate Document for Academic Demonstration"
    );

    // 1. Create Users
    console.log("Creating demo users across all 5 roles...");
    const admin = await User.create({
      name: "Dr. Elena Rostova",
      email: "admin@traceability.org",
      password: "Admin@12345",
      role: "ADMIN",
      organization: "Global Raw Material Traceability Authority",
      status: "ACTIVE",
      ethereumAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });

    const supplier1 = await User.create({
      name: "Carlos Mendoza",
      email: "supplier@atacama-lithium.com",
      password: "Supplier@12345",
      role: "SUPPLIER",
      organization: "Atacama Clean Lithium Corp",
      status: "ACTIVE",
      ethereumAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    });

    const supplier2 = await User.create({
      name: "Jean-Paul Kabila",
      email: "supplier@katanga-copper.com",
      password: "Supplier@12345",
      role: "SUPPLIER",
      organization: "Katanga Responsible Minerals Ltd",
      status: "PENDING_APPROVAL", // Demonstrates supplier approval workflow
      ethereumAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    });

    const manufacturer = await User.create({
      name: "Marcus Lindqvist",
      email: "mfg@nexusev-battery.com",
      password: "Mfg@12345",
      role: "MANUFACTURER",
      organization: "Nexus EV Cell Manufacturing AB",
      status: "ACTIVE",
      ethereumAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    });

    const auditor = await User.create({
      name: "Astrid Vanhove",
      email: "auditor@sgs-sustainability.org",
      password: "Auditor@12345",
      role: "AUDITOR",
      organization: "SGS Environmental & Social Auditing Services",
      status: "ACTIVE",
      ethereumAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    });

    const consumer = await User.create({
      name: "Sophia Zhang",
      email: "consumer@cleanenergy.org",
      password: "Consumer@12345",
      role: "CONSUMER",
      organization: "Public Consumer / CleanTech Watch",
      status: "ACTIVE",
    });

    // 2. Create Supplier Profiles
    console.log("Creating supplier profiles...");
    await Supplier.create({
      userId: supplier1._id,
      companyName: "Atacama Clean Lithium Corp",
      registrationNumber: "CL-MIN-2021-9988",
      country: "Chile",
      region: "Antofagasta / Salar de Atacama",
      facilityType: "Solar Evaporation & Direct Lithium Extraction",
      sourcingCategories: ["Mineral", "Lithium"],
      complianceStatus: "APPROVED",
      reviewNotes: "IRMA certified site inspection passed in Q1 2026.",
      reviewedBy: admin._id,
      reviewedAt: new Date("2026-02-15"),
    });

    await Supplier.create({
      userId: supplier2._id,
      companyName: "Katanga Responsible Minerals Ltd",
      registrationNumber: "DRC-KAT-2023-4412",
      country: "Democratic Republic of Congo",
      region: "Haut-Katanga",
      facilityType: "Electrowinning & Artisanal Co-Op Monitoring Facility",
      sourcingCategories: ["Metal", "Copper", "Cobalt"],
      complianceStatus: "PENDING_APPROVAL",
      reviewNotes: "Application submitted. Awaiting third-party conflict-free audit verification.",
    });

    // 3. Create Catalog of Raw Materials
    console.log("Seeding raw material catalog...");
    const rawMaterials = await RawMaterial.insertMany([
      {
        name: "Battery-Grade Lithium Hydroxide (LiOH)",
        category: "Mineral",
        description: "Ultra-pure 56.5% LiOH Monohydrate extracted via solar brine evaporation with low freshwater footprint.",
        standardUnit: "kg",
        applicableCertifications: ["IRMA-50", "ISO-14001", "Carbon-Trust-Certified"],
        isDemo: true,
      },
      {
        name: "Responsible Cathode Copper (Grade A)",
        category: "Metal",
        description: "99.9935% purity electrolytic copper cathode produced under conflict-free OECD Due Diligence guidance.",
        standardUnit: "metric_ton",
        applicableCertifications: ["The-Copper-Mark", "ISO-9001", "ISO-14001"],
        isDemo: true,
      },
      {
        name: "Fairtrade Organic Raw Cotton",
        category: "Fiber",
        description: "GOTS-certified non-GMO long-staple organic cotton harvested with rainwater irrigation.",
        standardUnit: "bale",
        applicableCertifications: ["GOTS", "Fairtrade", "OEKO-TEX-Standard-100"],
        isDemo: true,
      },
      {
        name: "Rainforest Alliance Shade-Grown Arabica",
        category: "Agriculture",
        description: "Single-origin high-altitude specialty green coffee beans sourced from zero-deforestation family micro-lots.",
        standardUnit: "bag",
        applicableCertifications: ["Rainforest-Alliance", "USDA-Organic"],
        isDemo: true,
      },
      {
        name: "Post-Consumer Recycled 6061 Aluminum Alloy",
        category: "Recycled",
        description: "100% recycled structural billet saving 95% embodied energy compared to primary smelting.",
        standardUnit: "metric_ton",
        applicableCertifications: ["ASI-Chain-of-Custody", "ISO-14021-Recycled-Content"],
        isDemo: true,
      },
    ]);

    // 4. Create Batches with Traceability Events
    console.log("Creating realistic batches and append-only event histories...");

    // Helper for QR generation
    const makeQR = async (batchId: string) => {
      try {
        return await QRCode.toDataURL(`http://localhost:5173/public/verify/${batchId}`, {
          errorCorrectionLevel: "H",
          margin: 2,
          color: { dark: "#064e3b", light: "#ffffff" },
        });
      } catch {
        return "";
      }
    };

    // --- BATCH 1: Lithium Hydroxide (Fully tracked journey with on-chain simulation) ---
    const lithiumBatchId = "BATCH-LITH-2026-001";
    const lithiumQR = await makeQR(lithiumBatchId);

    // Initial Registration Event
    const litEvt0Data = {
      batchId: lithiumBatchId,
      countryOfOrigin: "Chile",
      description: "Extraction of brine from Salar de Atacama reservoir block 4B.",
      eventType: "EXTRACTION_REGISTRATION",
      extractionDate: "2026-01-10T08:00:00.000Z",
      materialCategory: "Mineral",
      materialName: "Battery-Grade Lithium Hydroxide (LiOH)",
      organization: "Atacama Clean Lithium Corp",
      quantity: 10000,
      regionOfOrigin: "Salar de Atacama, Antofagasta",
      sourcingDeclarations: {
        environmentalCompliance: true,
        laborRightsCompliant: true,
        conflictFreeDeclared: true,
        recycledOrRenewable: false,
        details: "Direct brine reinjection utilized; zero groundwater depletion beyond authorized quota.",
      },
      unit: "kg",
    };
    const litHash0 = hashCanonicalEventData(litEvt0Data).hashBytes32;

    const litEvt0 = await TraceabilityEvent.create({
      eventId: `EVT-${lithiumBatchId}-00`,
      batchId: lithiumBatchId,
      eventType: "EXTRACTION_REGISTRATION",
      eventIndex: 0,
      actorId: supplier1._id,
      actorName: supplier1.name,
      actorRole: supplier1.role,
      organization: supplier1.organization,
      location: { name: "Salar de Atacama Evaporation Basin 4B", country: "Chile", latitude: -23.499, longitude: -68.329 },
      quantity: 10000,
      unit: "kg",
      previousEventHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      eventHash: litHash0,
      canonicalData: litEvt0Data,
      verificationStatus: "VERIFIED",
      blockchainStatus: "CONFIRMED",
      blockchainTxHash: "0x4a7e21a8d05e839e9f3b1405a39cb2017c6039589d81611b8166c4ef76993181",
      blockchainBlockNumber: 104210,
      notes: "Extracted under National Lithium Strategy concession permit #CL-2026-88.",
      timestamp: new Date("2026-01-10T08:00:00Z"),
      isDemo: true,
    });

    // Event 1: Initial Quality & Environmental Inspection
    const litEvt1Data = {
      batchId: lithiumBatchId,
      eventId: `EVT-${lithiumBatchId}-01`,
      eventIndex: 1,
      eventType: "INITIAL_INSPECTION",
      location: { name: "Antofagasta Regional Testing Lab", country: "Chile" },
      notes: "ICP-OES purity confirmed at 56.7% LiOH equivalent. Heavy metal trace elements below detection threshold.",
      organization: "SGS Environmental & Social Auditing Services",
      previousEventHash: litHash0,
      quantity: 10000,
      unit: "kg",
    };
    const litHash1 = hashCanonicalEventData(litEvt1Data).hashBytes32;

    const litEvt1 = await TraceabilityEvent.create({
      eventId: `EVT-${lithiumBatchId}-01`,
      batchId: lithiumBatchId,
      eventType: "INITIAL_INSPECTION",
      eventIndex: 1,
      actorId: auditor._id,
      actorName: auditor.name,
      actorRole: auditor.role,
      organization: auditor.organization,
      location: { name: "Antofagasta Regional Testing Lab", country: "Chile" },
      quantity: 10000,
      unit: "kg",
      previousEventHash: litHash0,
      eventHash: litHash1,
      canonicalData: litEvt1Data,
      verificationStatus: "VERIFIED",
      blockchainStatus: "CONFIRMED",
      blockchainTxHash: "0x8e12b7a4c90ef4931a7bc210984de389a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5",
      blockchainBlockNumber: 104225,
      notes: "Independent laboratory assay passed all battery-grade specs.",
      timestamp: new Date("2026-01-14T11:30:00Z"),
      isDemo: true,
    });

    // Event 2: Transportation & Port Handling
    const litEvt2Data = {
      batchId: lithiumBatchId,
      eventId: `EVT-${lithiumBatchId}-02`,
      eventIndex: 2,
      eventType: "TRANSPORTATION",
      location: { name: "Port of Mejillones Cargo Terminal", country: "Chile" },
      notes: "Containerized sealed shipment loaded onto MV Green Horizon bound for Port of Gothenburg, Sweden.",
      organization: "Atacama Clean Lithium Corp",
      previousEventHash: litHash1,
      quantity: 10000,
      unit: "kg",
    };
    const litHash2 = hashCanonicalEventData(litEvt2Data).hashBytes32;

    const litEvt2 = await TraceabilityEvent.create({
      eventId: `EVT-${lithiumBatchId}-02`,
      batchId: lithiumBatchId,
      eventType: "TRANSPORTATION",
      eventIndex: 2,
      actorId: supplier1._id,
      actorName: supplier1.name,
      actorRole: supplier1.role,
      organization: supplier1.organization,
      location: { name: "Port of Mejillones Cargo Terminal", country: "Chile" },
      quantity: 10000,
      unit: "kg",
      previousEventHash: litHash1,
      eventHash: litHash2,
      canonicalData: litEvt2Data,
      verificationStatus: "VERIFIED",
      blockchainStatus: "CONFIRMED",
      blockchainTxHash: "0x3f5c9e2b1a8d05e839e9f3b1405a39cb2017c6039589d81611b8166c4ef76993",
      blockchainBlockNumber: 104250,
      notes: "Maritime bill of lading #BL-MEJ-GOT-2026-092.",
      timestamp: new Date("2026-01-20T14:00:00Z"),
      isDemo: true,
    });

    // Event 3: Warehouse Receipt & Custody Transfer to Manufacturer
    const litEvt3Data = {
      batchId: lithiumBatchId,
      eventId: `EVT-${lithiumBatchId}-03`,
      eventIndex: 3,
      eventType: "CUSTODY_TRANSFER",
      location: { name: "Nexus EV Cell Gigafactory Warehouse #2, Skellefteå", country: "Sweden" },
      notes: "Custody and physical possession transferred to Nexus EV Cell Manufacturing AB.",
      organization: "Nexus EV Cell Manufacturing AB",
      previousEventHash: litHash2,
      quantity: 10000,
      unit: "kg",
    };
    const litHash3 = hashCanonicalEventData(litEvt3Data).hashBytes32;

    const litEvt3 = await TraceabilityEvent.create({
      eventId: `EVT-${lithiumBatchId}-03`,
      batchId: lithiumBatchId,
      eventType: "CUSTODY_TRANSFER",
      eventIndex: 3,
      actorId: manufacturer._id,
      actorName: manufacturer.name,
      actorRole: manufacturer.role,
      organization: manufacturer.organization,
      location: { name: "Nexus EV Cell Gigafactory Warehouse #2, Skellefteå", country: "Sweden" },
      quantity: 10000,
      unit: "kg",
      previousEventHash: litHash2,
      eventHash: litHash3,
      canonicalData: litEvt3Data,
      verificationStatus: "VERIFIED",
      blockchainStatus: "CONFIRMED",
      blockchainTxHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      blockchainBlockNumber: 104290,
      notes: "Goods received intact with unbroken tamper-evident container seals.",
      timestamp: new Date("2026-02-12T09:15:00Z"),
      isDemo: true,
    });

    const lithiumBatch = await Batch.create({
      batchId: lithiumBatchId,
      materialName: "Battery-Grade Lithium Hydroxide (LiOH)",
      materialCategory: "Mineral",
      description: "Ultra-pure lithium hydroxide derived from Salar de Atacama brine, destined for NMC811 high-nickel EV cells.",
      supplierId: supplier1._id,
      supplierName: supplier1.name,
      currentCustodianId: manufacturer._id,
      currentCustodianName: manufacturer.name,
      quantity: 10000,
      initialQuantity: 10000,
      unit: "kg",
      countryOfOrigin: "Chile",
      regionOfOrigin: "Salar de Atacama, Antofagasta",
      sourceLocation: { name: "Salar de Atacama Evaporation Basin 4B", latitude: -23.499, longitude: -68.329 },
      extractionDate: new Date("2026-01-10"),
      sourcingDeclarations: {
        environmentalCompliance: true,
        laborRightsCompliant: true,
        conflictFreeDeclared: true,
        recycledOrRenewable: false,
        details: "Direct brine reinjection utilized; zero groundwater depletion beyond authorized quota.",
      },
      status: "PROCESSING",
      initialEventHash: litHash0,
      initialBlockchainTxHash: "0x4a7e21a8d05e839e9f3b1405a39cb2017c6039589d81611b8166c4ef76993181",
      blockchainStatus: "CONFIRMED",
      parentBatchIds: [],
      childBatchIds: ["BATCH-LITH-2026-001-A", "BATCH-LITH-2026-001-B"],
      qrCodeDataUrl: lithiumQR,
      isDemo: true,
    });

    // --- BATCH 1 SPLIT: Child Batches for Demonstration of Genealogy ---
    const childAId = "BATCH-LITH-2026-001-A";
    const childBId = "BATCH-LITH-2026-001-B";
    const childAQR = await makeQR(childAId);
    const childBQR = await makeQR(childBId);

    const childACanonical = {
      batchId: childAId,
      eventType: "SPLIT",
      materialName: lithiumBatch.materialName,
      parentBatchId: lithiumBatchId,
      quantity: 6000,
      unit: "kg",
    };
    const childAHash = hashCanonicalEventData(childACanonical).hashBytes32;

    await Batch.create({
      batchId: childAId,
      materialName: "Battery-Grade Lithium Hydroxide (LiOH) - Lot Alpha",
      materialCategory: "Mineral",
      description: "Dedicated 6,000 kg split allocation for NMC811 cathode synthesis run #L-26.",
      supplierId: supplier1._id,
      supplierName: supplier1.name,
      currentCustodianId: manufacturer._id,
      currentCustodianName: manufacturer.name,
      quantity: 6000,
      initialQuantity: 6000,
      unit: "kg",
      countryOfOrigin: "Chile",
      regionOfOrigin: "Salar de Atacama, Antofagasta",
      sourceLocation: lithiumBatch.sourceLocation,
      extractionDate: lithiumBatch.extractionDate,
      sourcingDeclarations: lithiumBatch.sourcingDeclarations,
      status: "MANUFACTURED",
      initialEventHash: childAHash,
      blockchainStatus: "CONFIRMED",
      initialBlockchainTxHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      parentBatchIds: [lithiumBatchId],
      childBatchIds: [],
      qrCodeDataUrl: childAQR,
      isDemo: true,
    });

    await Batch.create({
      batchId: childBId,
      materialName: "Battery-Grade Lithium Hydroxide (LiOH) - Lot Beta",
      materialCategory: "Mineral",
      description: "Reserved 4,000 kg split allocation for LFP stationary storage battery prototyping.",
      supplierId: supplier1._id,
      supplierName: supplier1.name,
      currentCustodianId: manufacturer._id,
      currentCustodianName: manufacturer.name,
      quantity: 4000,
      initialQuantity: 4000,
      unit: "kg",
      countryOfOrigin: "Chile",
      regionOfOrigin: "Salar de Atacama, Antofagasta",
      sourceLocation: lithiumBatch.sourceLocation,
      extractionDate: lithiumBatch.extractionDate,
      sourcingDeclarations: lithiumBatch.sourcingDeclarations,
      status: "IN_TRANSIT",
      initialEventHash: childAHash,
      blockchainStatus: "CONFIRMED",
      parentBatchIds: [lithiumBatchId],
      childBatchIds: [],
      qrCodeDataUrl: childBQR,
      isDemo: true,
    });

    // Record Genealogy for Split
    await Genealogy.create({
      operationType: "SPLIT",
      parentBatchIds: [lithiumBatchId],
      childBatchIds: [childAId, childBId],
      records: [
        { batchId: lithiumBatchId, role: "PARENT", quantity: 10000, unit: "kg" },
        { batchId: childAId, role: "CHILD", quantity: 6000, unit: "kg" },
        { batchId: childBId, role: "CHILD", quantity: 4000, unit: "kg" },
      ],
      operatorId: manufacturer._id,
      operatorName: manufacturer.name,
      reason: "Split into high-performance EV cathode lot (6,000kg) and LFP prototyping lot (4,000kg).",
      timestamp: new Date("2026-02-18T10:00:00Z"),
    });

    // --- BATCH 2: Recycled Aluminum (Recycled & Circular Economy Demo) ---
    const alumBatchId = "BATCH-ALUM-2026-042";
    const alumQR = await makeQR(alumBatchId);

    const alumEvt0Data = {
      batchId: alumBatchId,
      countryOfOrigin: "Germany",
      description: "Collection of certified post-consumer architectural and automotive aluminum scrap.",
      eventType: "EXTRACTION_REGISTRATION",
      extractionDate: "2026-02-01T07:30:00.000Z",
      materialCategory: "Recycled",
      materialName: "Post-Consumer Recycled 6061 Aluminum Alloy",
      organization: "Heidelberg Circular Metallurgy GmbH",
      quantity: 25,
      regionOfOrigin: "Baden-Württemberg",
      sourcingDeclarations: {
        environmentalCompliance: true,
        laborRightsCompliant: true,
        conflictFreeDeclared: true,
        recycledOrRenewable: true,
        details: "100% pre-sorted post-consumer scrap; electric induction remelted with 100% certified wind power.",
      },
      unit: "metric_ton",
    };
    const alumHash0 = hashCanonicalEventData(alumEvt0Data).hashBytes32;

    await TraceabilityEvent.create({
      eventId: `EVT-${alumBatchId}-00`,
      batchId: alumBatchId,
      eventType: "EXTRACTION_REGISTRATION",
      eventIndex: 0,
      actorId: admin._id,
      actorName: "Heidelberg Circular Recycling Center",
      actorRole: "SUPPLIER",
      organization: "Heidelberg Circular Metallurgy GmbH",
      location: { name: "Heidelberg Circular Metallurgy Facility", country: "Germany", latitude: 49.398, longitude: 8.672 },
      quantity: 25,
      unit: "metric_ton",
      previousEventHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      eventHash: alumHash0,
      canonicalData: alumEvt0Data,
      verificationStatus: "VERIFIED",
      blockchainStatus: "CONFIRMED",
      blockchainTxHash: "0xaa11bb22cc33dd44ee55ff6677889900112233445566778899aabbccddeeff00",
      blockchainBlockNumber: 104330,
      notes: "ASI Chain of Custody certification verification complete.",
      timestamp: new Date("2026-02-01T07:30:00Z"),
      isDemo: true,
    });

    await Batch.create({
      batchId: alumBatchId,
      materialName: "Post-Consumer Recycled 6061 Aluminum Alloy",
      materialCategory: "Recycled",
      description: "Low-carbon recycled structural aluminum billet, achieving a 95% reduction in embodied greenhouse gas emissions.",
      supplierId: admin._id,
      supplierName: "Heidelberg Circular Metallurgy",
      currentCustodianId: manufacturer._id,
      currentCustodianName: manufacturer.name,
      quantity: 25,
      initialQuantity: 25,
      unit: "metric_ton",
      countryOfOrigin: "Germany",
      regionOfOrigin: "Baden-Württemberg",
      sourceLocation: { name: "Heidelberg Circular Metallurgy Facility", latitude: 49.398, longitude: 8.672 },
      extractionDate: new Date("2026-02-01"),
      sourcingDeclarations: {
        environmentalCompliance: true,
        laborRightsCompliant: true,
        conflictFreeDeclared: true,
        recycledOrRenewable: true,
        details: "100% pre-sorted post-consumer scrap; electric induction remelted with 100% certified wind power.",
      },
      status: "MANUFACTURED",
      initialEventHash: alumHash0,
      blockchainStatus: "CONFIRMED",
      initialBlockchainTxHash: "0xaa11bb22cc33dd44ee55ff6677889900112233445566778899aabbccddeeff00",
      parentBatchIds: [],
      childBatchIds: [],
      qrCodeDataUrl: alumQR,
      isDemo: true,
    });

    // --- BATCH 3: Fairtrade Organic Raw Cotton (Agriculture / Fiber Demo) ---
    const cottonBatchId = "BATCH-COTT-2026-108";
    const cottonQR = await makeQR(cottonBatchId);

    const cottEvt0Data = {
      batchId: cottonBatchId,
      countryOfOrigin: "India",
      description: "Harvest of certified organic long-staple cotton from rural cooperative farmers.",
      eventType: "EXTRACTION_REGISTRATION",
      extractionDate: "2026-02-10T06:00:00.000Z",
      materialCategory: "Fiber",
      materialName: "Fairtrade Organic Raw Cotton",
      organization: "Gujarat Organic Farmers Cooperative",
      quantity: 200,
      regionOfOrigin: "Gujarat, Saurashtra",
      sourcingDeclarations: {
        environmentalCompliance: true,
        laborRightsCompliant: true,
        conflictFreeDeclared: true,
        recycledOrRenewable: true,
        details: "Non-GMO seeds verified; zero synthetic pesticides; Fairtrade premium paid to all participating smallholders.",
      },
      unit: "bale",
    };
    const cottHash0 = hashCanonicalEventData(cottEvt0Data).hashBytes32;

    await TraceabilityEvent.create({
      eventId: `EVT-${cottonBatchId}-00`,
      batchId: cottonBatchId,
      eventType: "EXTRACTION_REGISTRATION",
      eventIndex: 0,
      actorId: supplier1._id,
      actorName: "Gujarat Organic Farmers Collective",
      actorRole: "SUPPLIER",
      organization: "Gujarat Organic Farmers Collective",
      location: { name: "Rajkot Ginning & Pressing Cooperative", country: "India", latitude: 22.303, longitude: 70.802 },
      quantity: 200,
      unit: "bale",
      previousEventHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      eventHash: cottHash0,
      canonicalData: cottEvt0Data,
      verificationStatus: "VERIFIED",
      blockchainStatus: "CONFIRMED",
      blockchainTxHash: "0xbb22cc33dd44ee55ff667788990011223344556677889900aabbccddeeff0011",
      blockchainBlockNumber: 104380,
      notes: "GOTS certificate verified by OneCert International.",
      timestamp: new Date("2026-02-10T06:00:00Z"),
      isDemo: true,
    });

    await Batch.create({
      batchId: cottonBatchId,
      materialName: "Fairtrade Organic Raw Cotton",
      materialCategory: "Fiber",
      description: "GOTS-certified non-GMO raw cotton harvested by 42 smallholder farming families in Saurashtra.",
      supplierId: supplier1._id,
      supplierName: "Gujarat Organic Farmers Collective",
      currentCustodianId: supplier1._id,
      currentCustodianName: "Gujarat Organic Farmers Collective",
      quantity: 200,
      initialQuantity: 200,
      unit: "bale",
      countryOfOrigin: "India",
      regionOfOrigin: "Gujarat, Saurashtra",
      sourceLocation: { name: "Rajkot Ginning & Pressing Cooperative", latitude: 22.303, longitude: 70.802 },
      extractionDate: new Date("2026-02-10"),
      sourcingDeclarations: {
        environmentalCompliance: true,
        laborRightsCompliant: true,
        conflictFreeDeclared: true,
        recycledOrRenewable: true,
        details: "Non-GMO seeds verified; zero synthetic pesticides; Fairtrade premium paid to all participating smallholders.",
      },
      status: "IN_TRANSIT",
      initialEventHash: cottHash0,
      blockchainStatus: "CONFIRMED",
      initialBlockchainTxHash: "0xbb22cc33dd44ee55ff667788990011223344556677889900aabbccddeeff0011",
      parentBatchIds: [],
      childBatchIds: [],
      qrCodeDataUrl: cottonQR,
      isDemo: true,
    });

    // --- BATCH 4: Copper (Demonstrating Suspicious/Disputed Audit Flag) ---
    const copperBatchId = "BATCH-COPP-2026-774";
    const copperQR = await makeQR(copperBatchId);

    const coppEvt0Data = {
      batchId: copperBatchId,
      countryOfOrigin: "Democratic Republic of Congo",
      description: "Artisanal & small-scale copper extraction co-op lot #774.",
      eventType: "EXTRACTION_REGISTRATION",
      extractionDate: "2026-02-14T09:00:00.000Z",
      materialCategory: "Metal",
      materialName: "Responsible Cathode Copper (Grade A)",
      organization: "Katanga Responsible Minerals Ltd",
      quantity: 50,
      regionOfOrigin: "Haut-Katanga",
      sourcingDeclarations: {
        environmentalCompliance: false,
        laborRightsCompliant: false,
        conflictFreeDeclared: true,
        recycledOrRenewable: false,
        details: "Self-declared conflict-free by supplier; third-party OECD audit verification not yet completed.",
      },
      unit: "metric_ton",
    };
    const coppHash0 = hashCanonicalEventData(coppEvt0Data).hashBytes32;

    await TraceabilityEvent.create({
      eventId: `EVT-${copperBatchId}-00`,
      batchId: copperBatchId,
      eventType: "EXTRACTION_REGISTRATION",
      eventIndex: 0,
      actorId: supplier2._id,
      actorName: supplier2.name,
      actorRole: supplier2.role,
      organization: supplier2.organization,
      location: { name: "Kolwezi Mineral Aggregation Site", country: "DRC", latitude: -10.716, longitude: 25.472 },
      quantity: 50,
      unit: "metric_ton",
      previousEventHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      eventHash: coppHash0,
      canonicalData: coppEvt0Data,
      verificationStatus: "UNVERIFIED",
      blockchainStatus: "PENDING",
      notes: "Self-reported declaration by supplier; pending third-party OECD due-diligence audit.",
      timestamp: new Date("2026-02-14T09:00:00Z"),
      isDemo: true,
    });

    // Auditor Flag Event
    const coppEvt1Data = {
      batchId: copperBatchId,
      eventId: `EVT-${copperBatchId}-01`,
      eventType: "AUDIT_FLAG",
      flaggedBy: auditor.email,
      flaggedRole: auditor.role,
      notes: "Chain-of-custody documentation gap: Missing artisanal pit safety declarations and child-labor-free affidavits.",
      previousEventHash: coppHash0,
      severity: "WARNING",
    };
    const coppHash1 = hashCanonicalEventData(coppEvt1Data).hashBytes32;

    await TraceabilityEvent.create({
      eventId: `EVT-${copperBatchId}-01`,
      batchId: copperBatchId,
      eventType: "AUDIT_FLAG",
      eventIndex: 1,
      actorId: auditor._id,
      actorName: auditor.name,
      actorRole: auditor.role,
      organization: auditor.organization,
      location: { name: "Kolwezi Mineral Aggregation Site", country: "DRC" },
      previousEventHash: coppHash0,
      eventHash: coppHash1,
      canonicalData: coppEvt1Data,
      verificationStatus: "VERIFIED",
      notes: "Auditor Inquiry: Missing pit safety certificates and child-labor verification docs.",
      timestamp: new Date("2026-02-16T15:00:00Z"),
      isDemo: true,
    });

    await Batch.create({
      batchId: copperBatchId,
      materialName: "Responsible Cathode Copper (Grade A)",
      materialCategory: "Metal",
      description: "Artisanal & small-scale copper aggregation from Kolwezi perimeter; under formal auditor inquiry.",
      supplierId: supplier2._id,
      supplierName: supplier2.name,
      currentCustodianId: supplier2._id,
      currentCustodianName: supplier2.name,
      quantity: 50,
      initialQuantity: 50,
      unit: "metric_ton",
      countryOfOrigin: "Democratic Republic of Congo",
      regionOfOrigin: "Haut-Katanga",
      sourceLocation: { name: "Kolwezi Mineral Aggregation Site", latitude: -10.716, longitude: 25.472 },
      extractionDate: new Date("2026-02-14"),
      sourcingDeclarations: {
        environmentalCompliance: false,
        laborRightsCompliant: false,
        conflictFreeDeclared: true,
        recycledOrRenewable: false,
        details: "Self-declared conflict-free by supplier; third-party OECD audit verification not yet completed.",
      },
      status: "FLAGGED",
      isFlagged: true,
      flagReason: "Chain-of-custody documentation gap: Missing artisanal pit safety declarations and child-labor-free affidavits.",
      initialEventHash: coppHash0,
      blockchainStatus: "PENDING",
      parentBatchIds: [],
      childBatchIds: [],
      qrCodeDataUrl: copperQR,
      isDemo: true,
    });

    // 5. Create Sustainability Certificates
    console.log("Seeding sustainability certificates...");
    await Certificate.create({
      batchId: lithiumBatchId,
      materialName: "Battery-Grade Lithium Hydroxide (LiOH)",
      certificateType: "IRMA",
      certificateName: "IRMA Achievement 50 - Responsible Mining Standard",
      certificateNumber: "IRMA-ATACAMA-2025-081",
      issuer: "Initiative for Responsible Mining Assurance (IRMA)",
      issueDate: new Date("2025-06-01"),
      expiryDate: new Date("2028-06-01"),
      scope: "Salar de Atacama brine extraction, indigenous community revenue sharing, and freshwater conservation.",
      sourcingClaims: {
        environmental: true,
        laborHumanRights: true,
        conflictFree: true,
        recycledRenewable: false,
      },
      originalFileName: "IRMA-Achievement-50-Atacama.pdf",
      filePath: "sample-irma-iso14001-cert.pdf",
      fileSizeBytes: 1042500,
      mimeType: "application/pdf",
      documentHash: "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
      blockchainTxHash: "0xcc33dd44ee55ff667788990011223344556677889900112233445566778899aa",
      status: "VERIFIED",
      submittedById: supplier1._id,
      submittedByName: supplier1.name,
      reviewerId: auditor._id,
      reviewerName: auditor.name,
      reviewerNotes: "Independently verified against IRMA Public Registry database record #081. Audit grade validated.",
      reviewedAt: new Date("2026-01-12"),
      isDemo: true,
    });

    await Certificate.create({
      batchId: lithiumBatchId,
      materialName: "Battery-Grade Lithium Hydroxide (LiOH)",
      certificateType: "ISO_14001",
      certificateName: "ISO 14001:2015 Environmental Management System",
      certificateNumber: "SGS-EMS-CL-2024-4401",
      issuer: "SGS International Certification",
      issueDate: new Date("2024-04-10"),
      expiryDate: new Date("2027-04-10"),
      scope: "Environmental management of brine pumping, solar evaporation ponds, and chemical precipitation.",
      sourcingClaims: {
        environmental: true,
        laborHumanRights: false,
        conflictFree: false,
        recycledRenewable: false,
      },
      originalFileName: "SGS-ISO-14001-Certificate.pdf",
      filePath: "sample-irma-iso14001-cert.pdf",
      fileSizeBytes: 890400,
      mimeType: "application/pdf",
      documentHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      blockchainTxHash: "0xdd44ee55ff667788990011223344556677889900112233445566778899aabbcc",
      status: "VERIFIED",
      submittedById: supplier1._id,
      submittedByName: supplier1.name,
      reviewerId: auditor._id,
      reviewerName: auditor.name,
      reviewerNotes: "Annual surveillance audit passed with zero major non-conformances.",
      reviewedAt: new Date("2026-01-12"),
      isDemo: true,
    });

    await Certificate.create({
      batchId: copperBatchId,
      materialName: "Responsible Cathode Copper (Grade A)",
      certificateType: "CONFLICT_FREE",
      certificateName: "RMI Responsible Minerals Assurance Process (RMAP)",
      certificateNumber: "RMAP-DRC-KAT-2026-PENDING",
      issuer: "Responsible Minerals Initiative (RMI)",
      issueDate: new Date("2026-01-01"),
      expiryDate: new Date("2027-01-01"),
      scope: "Downstream supply chain conflict-free smelter validation.",
      sourcingClaims: {
        environmental: false,
        laborHumanRights: true,
        conflictFree: true,
        recycledRenewable: false,
      },
      originalFileName: "RMAP-Self-Assessment-Document.pdf",
      filePath: "sample-irma-iso14001-cert.pdf",
      fileSizeBytes: 420000,
      mimeType: "application/pdf",
      documentHash: "0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      status: "PENDING_VERIFICATION",
      submittedById: supplier2._id,
      submittedByName: supplier2.name,
      reviewerNotes: "Third-party on-site smelter visit pending scheduling for Q2 2026.",
      isDemo: true,
    });

    // 6. Create Audit Logs
    console.log("Seeding system audit logs...");
    await AuditLog.insertMany([
      {
        action: "SYSTEM_INITIALIZED",
        actorId: admin._id,
        actorEmail: admin.email,
        actorRole: admin.role,
        targetResource: "System",
        targetId: "GLOBAL_REGISTRY",
        details: { version: "1.0.0", environment: "academic_production_simulation" },
        severity: "INFO",
      },
      {
        action: "SUPPLIER_APPROVED",
        actorId: admin._id,
        actorEmail: admin.email,
        actorRole: admin.role,
        targetResource: "Supplier",
        targetId: supplier1._id.toString(),
        details: { companyName: "Atacama Clean Lithium Corp", verifiedStandard: "IRMA-50" },
        severity: "INFO",
      },
      {
        action: "AUDIT_INQUIRY_FLAGGED",
        actorId: auditor._id,
        actorEmail: auditor.email,
        actorRole: auditor.role,
        targetResource: "Batch",
        targetId: copperBatchId,
        details: { reason: "Missing artisanal pit safety and child labor compliance declarations." },
        severity: "WARNING",
      },
    ]);

    console.log("\n=======================================================");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log("Demo Credentials:");
    console.log("  1. Admin:         admin@traceability.org          / Admin@12345");
    console.log("  2. Supplier (OK): supplier@atacama-lithium.com    / Supplier@12345");
    console.log("  3. Supplier (Pen):supplier@katanga-copper.com     / Supplier@12345");
    console.log("  4. Manufacturer:  mfg@nexusev-battery.com         / Mfg@12345");
    console.log("  5. Auditor:       auditor@sgs-sustainability.org  / Auditor@12345");
    console.log("  6. Consumer:      consumer@cleanenergy.org        / Consumer@12345");
    console.log("Demo Batches Seeded:");
    console.log(`  - Lithium (Journey + Split): ${lithiumBatchId} -> [${childAId}, ${childBId}]`);
    console.log(`  - Recycled Aluminum:         ${alumBatchId}`);
    console.log(`  - Organic Cotton:            ${cottonBatchId}`);
    console.log(`  - Copper (Auditor Flagged):  ${copperBatchId}`);
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
