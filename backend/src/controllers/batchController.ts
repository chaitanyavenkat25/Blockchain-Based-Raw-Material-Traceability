import { Request, Response } from "express";
import QRCode from "qrcode";
import { Batch, IBatch } from "../models/Batch";
import { TraceabilityEvent, ITraceabilityEvent } from "../models/TraceabilityEvent";
import { Genealogy } from "../models/Genealogy";
import { Certificate } from "../models/Certificate";
import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";
import {
  createBatchSchema,
  createEventSchema,
  splitBatchSchema,
  mergeBatchSchema,
} from "../validators";
import { hashCanonicalEventData } from "../utils/canonicalHash";
import { blockchainService } from "../services/blockchainService";
import { TamperAuditService } from "../services/tamperAuditService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const createBatch = async (req: AuthenticatedRequest, res: Response) => {
  const validated = createBatchSchema.parse(req.body);
  const user = req.user!;

  // Generate unique batch ID if not supplied
  const catCode = validated.materialCategory.substring(0, 4).toUpperCase();
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const batchId = validated.batchId || `BATCH-${catCode}-${year}-${randomSuffix}`;

  const existing = await Batch.findOne({ batchId });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: `Batch ID '${batchId}' is already registered.`,
    });
  }

  const extractionDate = new Date(validated.extractionDate);

  // 1. Construct canonical data for initial registration event
  const canonicalRegData = {
    batchId,
    countryOfOrigin: validated.countryOfOrigin,
    description: validated.description,
    eventType: "EXTRACTION_REGISTRATION",
    extractionDate: extractionDate.toISOString(),
    materialCategory: validated.materialCategory,
    materialName: validated.materialName,
    organization: user.organization,
    quantity: validated.quantity,
    regionOfOrigin: validated.regionOfOrigin,
    sourcingDeclarations: validated.sourcingDeclarations,
    unit: validated.unit,
  };

  const { hashHex, hashBytes32 } = hashCanonicalEventData(canonicalRegData);

  // 2. Generate QR code pointing to public verification URL
  const publicVerifyUrl = `${process.env.PUBLIC_FRONTEND_URL || "http://localhost:5173"}/public/verify/${batchId}`;
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(publicVerifyUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#064e3b", // Deep forest green
        light: "#ffffff",
      },
    });
  } catch (qrErr) {
    console.warn("QR code generation warning:", qrErr);
  }

  // 3. Create initial Traceability Event in DB
  const initialEvent = new TraceabilityEvent({
    eventId: `EVT-${batchId}-00`,
    batchId,
    eventType: "EXTRACTION_REGISTRATION",
    eventIndex: 0,
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    organization: user.organization,
    location: validated.sourceLocation,
    quantity: validated.quantity,
    unit: validated.unit,
    previousEventHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    eventHash: hashBytes32,
    canonicalData: canonicalRegData,
    verificationStatus: "VERIFIED",
    blockchainStatus: "PENDING",
    notes: "Initial extraction and registration event",
    timestamp: new Date(),
  });

  // 4. Record on blockchain smart contract
  const chainResult = await blockchainService.registerBatch(
    batchId,
    validated.materialCategory,
    validated.materialName,
    user.ethereumAddress || "0x0000000000000000000000000000000000000000",
    validated.quantity,
    validated.unit,
    hashBytes32
  );

  initialEvent.blockchainStatus = chainResult.status;
  if (chainResult.txHash) {
    initialEvent.blockchainTxHash = chainResult.txHash;
    initialEvent.blockchainBlockNumber = chainResult.blockNumber;
  }
  await initialEvent.save();

  // 5. Create Batch record in DB
  const batch = new Batch({
    batchId,
    materialName: validated.materialName,
    materialCategory: validated.materialCategory,
    description: validated.description,
    supplierId: user._id,
    supplierName: user.name,
    currentCustodianId: user._id,
    currentCustodianName: user.name,
    quantity: validated.quantity,
    initialQuantity: validated.quantity,
    unit: validated.unit,
    countryOfOrigin: validated.countryOfOrigin,
    regionOfOrigin: validated.regionOfOrigin,
    sourceLocation: validated.sourceLocation,
    extractionDate,
    sourcingDeclarations: validated.sourcingDeclarations,
    status: "REGISTERED",
    initialEventHash: hashBytes32,
    initialBlockchainTxHash: chainResult.txHash,
    blockchainStatus: chainResult.status,
    qrCodeDataUrl,
    parentBatchIds: [],
    childBatchIds: [],
    isDemo: false,
  });

  await batch.save();

  await AuditLog.create({
    action: "BATCH_REGISTERED",
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    targetResource: "Batch",
    targetId: batchId,
    details: {
      materialName: batch.materialName,
      quantity: batch.quantity,
      blockchainStatus: chainResult.status,
      txHash: chainResult.txHash,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Raw material batch registered successfully.",
    data: {
      batch,
      initialEvent,
      blockchainResult: chainResult,
    },
  });
};

export const getBatches = async (req: Request, res: Response) => {
  const { category, status, search, mine, supplierId, isFlagged, page = "1", limit = "20" } = req.query;
  const filter: any = {};

  if (category) filter.materialCategory = category;
  if (status) filter.status = status;
  if (isFlagged !== undefined) filter.isFlagged = isFlagged === "true";
  if (supplierId) filter.supplierId = supplierId;

  if (search) {
    filter.$or = [
      { batchId: { $regex: search, $options: "i" } },
      { materialName: { $regex: search, $options: "i" } },
      { countryOfOrigin: { $regex: search, $options: "i" } },
      { regionOfOrigin: { $regex: search, $options: "i" } },
      { supplierName: { $regex: search, $options: "i" } },
    ];
  }

  const p = Math.max(1, parseInt(page as string, 10));
  const l = Math.max(1, parseInt(limit as string, 10));
  const skip = (p - 1) * l;

  const total = await Batch.countDocuments(filter);
  const batches = await Batch.find(filter)
    .populate("supplierId", "name email organization status")
    .populate("currentCustodianId", "name email organization role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(l);

  return res.json({
    success: true,
    data: batches,
    pagination: {
      page: p,
      limit: l,
      total,
      pages: Math.ceil(total / l),
    },
  });
};

export const getBatchById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const batch = await Batch.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }] })
    .populate("supplierId", "name email organization status")
    .populate("currentCustodianId", "name email organization role");

  if (!batch) {
    return res.status(404).json({ success: false, message: "Batch not found." });
  }

  const eventsCount = await TraceabilityEvent.countDocuments({ batchId: batch.batchId });
  const certificates = await Certificate.find({ batchId: batch.batchId });

  return res.json({
    success: true,
    data: {
      batch,
      eventsCount,
      certificates,
    },
  });
};

export const getBatchTraceability = async (req: Request, res: Response) => {
  const { id } = req.params;
  const batch = await Batch.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }] });
  if (!batch) {
    return res.status(404).json({ success: false, message: "Batch not found." });
  }

  const events = await TraceabilityEvent.find({ batchId: batch.batchId })
    .sort({ eventIndex: 1 })
    .populate("actorId", "name email organization role");

  return res.json({
    success: true,
    data: {
      batchId: batch.batchId,
      materialName: batch.materialName,
      status: batch.status,
      isFlagged: batch.isFlagged,
      events,
    },
  });
};

export const addEvent = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = createEventSchema.parse(req.body);
  const user = req.user!;

  const batch = await Batch.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }] });
  if (!batch) {
    return res.status(404).json({ success: false, message: "Batch not found." });
  }

  // Get previous event to ensure cryptographic hash chain linkage
  const lastEvent = await TraceabilityEvent.findOne({ batchId: batch.batchId }).sort({ eventIndex: -1 });
  const prevHash = lastEvent ? lastEvent.eventHash : "0x0000000000000000000000000000000000000000000000000000000000000000";
  const nextIndex = lastEvent ? lastEvent.eventIndex + 1 : 0;
  const eventId = `EVT-${batch.batchId}-${String(nextIndex).padStart(2, "0")}`;

  // If custody transfer, handle new custodian lookup
  let newCustodianName = "";
  if (validated.eventType === "CUSTODY_TRANSFER" && validated.newCustodianId) {
    const newCust = await User.findById(validated.newCustodianId);
    if (newCust) {
      batch.currentCustodianId = newCust._id;
      batch.currentCustodianName = newCust.name;
      newCustodianName = newCust.name;
    }
  }

  // Update batch status according to event
  if (validated.eventType === "TRANSPORTATION") batch.status = "IN_TRANSIT";
  else if (validated.eventType === "PROCESSING") batch.status = "PROCESSING";
  else if (validated.eventType === "MANUFACTURING") batch.status = "MANUFACTURED";
  else if (validated.eventType === "AUDIT_FLAG") {
    batch.isFlagged = true;
    batch.flagReason = validated.notes || "Flagged during audit inspection";
  }

  // Normalize canonical event data
  const canonicalData = {
    batchId: batch.batchId,
    eventId,
    eventIndex: nextIndex,
    eventType: validated.eventType,
    evidenceDocumentHashes: validated.evidenceDocumentHashes,
    location: validated.location,
    notes: validated.notes || "",
    organization: user.organization,
    previousEventHash: prevHash,
    quantity: validated.quantity || batch.quantity,
    unit: validated.unit || batch.unit,
  };

  const { hashBytes32 } = hashCanonicalEventData(canonicalData);

  const event = new TraceabilityEvent({
    eventId,
    batchId: batch.batchId,
    eventType: validated.eventType,
    eventIndex: nextIndex,
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    organization: user.organization,
    location: validated.location,
    quantity: validated.quantity || batch.quantity,
    unit: validated.unit || batch.unit,
    previousEventHash: prevHash,
    eventHash: hashBytes32,
    canonicalData,
    verificationStatus: "VERIFIED",
    blockchainStatus: "PENDING",
    evidenceDocumentHashes: validated.evidenceDocumentHashes,
    notes: validated.notes,
    timestamp: new Date(),
  });

  // Record on blockchain
  const chainResult = await blockchainService.recordEvent(
    batch.batchId,
    eventId,
    validated.eventType,
    hashBytes32,
    prevHash
  );

  event.blockchainStatus = chainResult.status;
  if (chainResult.txHash) {
    event.blockchainTxHash = chainResult.txHash;
    event.blockchainBlockNumber = chainResult.blockNumber;
  }

  await event.save();
  await batch.save();

  await AuditLog.create({
    action: "TRACEABILITY_EVENT_RECORDED",
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    targetResource: "Batch",
    targetId: batch.batchId,
    details: {
      eventId,
      eventType: validated.eventType,
      blockchainStatus: chainResult.status,
      txHash: chainResult.txHash,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Traceability event recorded successfully.",
    data: {
      event,
      blockchainResult: chainResult,
    },
  });
};

export const verifyBatchIntegrity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const batch = await Batch.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }] });
  if (!batch) {
    return res.status(404).json({ success: false, message: "Batch not found." });
  }

  const auditReport = await TamperAuditService.verifyBatchIntegrity(batch.batchId);

  return res.json({
    success: true,
    data: auditReport,
  });
};

/**
 * Academic Simulation: Alter a database field directly to demonstrate cryptographic tamper detection!
 */
export const simulateTamper = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { field = "quantity", tamperedValue = 99999 } = req.body;

  const batch = await Batch.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }] });
  if (!batch) {
    return res.status(404).json({ success: false, message: "Batch not found." });
  }

  // Find the latest event and tamper its canonicalData directly in the DB WITHOUT updating the stored hash or blockchain!
  const event = await TraceabilityEvent.findOne({ batchId: batch.batchId }).sort({ eventIndex: -1 });
  if (!event) {
    return res.status(400).json({ success: false, message: "No events to tamper." });
  }

  const originalValue = event.canonicalData[field];
  event.canonicalData[field] = tamperedValue;
  event.markModified("canonicalData");
  await event.save();

  await AuditLog.create({
    action: "TAMPER_SIMULATION_EXECUTED",
    actorId: req.user!._id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    targetResource: "TraceabilityEvent",
    targetId: event.eventId,
    details: {
      fieldTampered: field,
      originalValue,
      tamperedValue,
      explanation: "Academic demo simulation of silent off-chain database modification",
    },
    severity: "WARNING",
  });

  return res.json({
    success: true,
    message: `Academic Tamper Simulation: Field '${field}' modified from '${originalValue}' to '${tamperedValue}' in database. Stored hash and blockchain remain untouched. Run integrity verification to detect!`,
    data: {
      eventId: event.eventId,
      tamperedField: field,
      originalValue,
      tamperedValue,
    },
  });
};

export const splitBatch = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = splitBatchSchema.parse(req.body);
  const user = req.user!;

  const parent = await Batch.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }] });
  if (!parent) {
    return res.status(404).json({ success: false, message: "Parent batch not found." });
  }

  if (parent.status === "SPLIT") {
    return res.status(400).json({ success: false, message: "This batch has already been split." });
  }

  // Validate quantities: sum of child quantities must not exceed parent quantity
  const totalChildQuantity = validated.childBatches.reduce((acc, c) => acc + c.quantity, 0);
  if (totalChildQuantity > parent.quantity) {
    return res.status(400).json({
      success: false,
      message: `Invalid split: total child quantity (${totalChildQuantity} ${parent.unit}) exceeds parent available quantity (${parent.quantity} ${parent.unit}).`,
    });
  }

  const createdChildren: IBatch[] = [];
  const childBatchIds: string[] = [];

  for (const c of validated.childBatches) {
    childBatchIds.push(c.batchId);

    const publicVerifyUrl = `${process.env.PUBLIC_FRONTEND_URL || "http://localhost:5173"}/public/verify/${c.batchId}`;
    let qr = "";
    try {
      qr = await QRCode.toDataURL(publicVerifyUrl);
    } catch {}

    const childCanonical = {
      batchId: c.batchId,
      eventType: "SPLIT",
      materialName: parent.materialName,
      materialCategory: parent.materialCategory,
      parentBatchId: parent.batchId,
      quantity: c.quantity,
      unit: c.unit,
      splitReason: validated.reason,
    };
    const { hashBytes32 } = hashCanonicalEventData(childCanonical);

    const childBatch = new Batch({
      batchId: c.batchId,
      materialName: parent.materialName,
      materialCategory: parent.materialCategory,
      description: c.description || `Derived from split of ${parent.batchId}`,
      supplierId: parent.supplierId,
      supplierName: parent.supplierName,
      currentCustodianId: user._id,
      currentCustodianName: user.name,
      quantity: c.quantity,
      initialQuantity: c.quantity,
      unit: c.unit,
      countryOfOrigin: parent.countryOfOrigin,
      regionOfOrigin: parent.regionOfOrigin,
      sourceLocation: parent.sourceLocation,
      extractionDate: parent.extractionDate,
      sourcingDeclarations: parent.sourcingDeclarations,
      status: "REGISTERED",
      initialEventHash: hashBytes32,
      blockchainStatus: "PENDING",
      parentBatchIds: [parent.batchId],
      childBatchIds: [],
      qrCodeDataUrl: qr,
    });
    await childBatch.save();
    createdChildren.push(childBatch);

    // Initial event for child
    await TraceabilityEvent.create({
      eventId: `EVT-${c.batchId}-00`,
      batchId: c.batchId,
      eventType: "SPLIT",
      eventIndex: 0,
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      organization: user.organization,
      location: parent.sourceLocation,
      quantity: c.quantity,
      unit: c.unit,
      previousEventHash: parent.initialEventHash,
      eventHash: hashBytes32,
      canonicalData: childCanonical,
      verificationStatus: "VERIFIED",
      notes: `Split from parent batch ${parent.batchId}. Reason: ${validated.reason}`,
    });

    // Record on blockchain
    await blockchainService.recordGenealogy(parent.batchId, c.batchId, "SPLIT");
  }

  // Update parent batch
  parent.status = "SPLIT";
  parent.childBatchIds = childBatchIds;
  await parent.save();

  // Record genealogy entity
  const genealogy = await Genealogy.create({
    operationType: "SPLIT",
    parentBatchIds: [parent.batchId],
    childBatchIds,
    records: [
      { batchId: parent.batchId, role: "PARENT", quantity: parent.quantity, unit: parent.unit },
      ...validated.childBatches.map((c) => ({
        batchId: c.batchId,
        role: "CHILD" as const,
        quantity: c.quantity,
        unit: c.unit,
      })),
    ],
    operatorId: user._id,
    operatorName: user.name,
    reason: validated.reason,
  });

  return res.status(201).json({
    success: true,
    message: `Batch ${parent.batchId} successfully split into ${createdChildren.length} child batches.`,
    data: {
      parent,
      children: createdChildren,
      genealogy,
    },
  });
};

export const mergeBatches = async (req: AuthenticatedRequest, res: Response) => {
  const validated = mergeBatchSchema.parse(req.body);
  const user = req.user!;

  const parents = await Batch.find({ batchId: { $in: validated.inputBatchIds } });
  if (parents.length !== validated.inputBatchIds.length) {
    return res.status(404).json({
      success: false,
      message: "One or more input parent batches could not be found.",
    });
  }

  const existingOut = await Batch.findOne({ batchId: validated.outputBatch.batchId });
  if (existingOut) {
    return res.status(409).json({
      success: false,
      message: `Output batch ID '${validated.outputBatch.batchId}' already exists.`,
    });
  }

  const publicVerifyUrl = `${process.env.PUBLIC_FRONTEND_URL || "http://localhost:5173"}/public/verify/${validated.outputBatch.batchId}`;
  let qr = "";
  try {
    qr = await QRCode.toDataURL(publicVerifyUrl);
  } catch {}

  const canonicalMerge = {
    batchId: validated.outputBatch.batchId,
    eventType: "MERGE",
    inputBatchIds: validated.inputBatchIds,
    materialCategory: validated.outputBatch.materialCategory,
    materialName: validated.outputBatch.materialName,
    mergeReason: validated.reason,
    quantity: validated.outputBatch.quantity,
    unit: validated.outputBatch.unit,
  };
  const { hashBytes32 } = hashCanonicalEventData(canonicalMerge);

  const outputBatch = new Batch({
    batchId: validated.outputBatch.batchId,
    materialName: validated.outputBatch.materialName,
    materialCategory: validated.outputBatch.materialCategory,
    description: validated.outputBatch.description,
    supplierId: parents[0].supplierId,
    supplierName: parents[0].supplierName,
    currentCustodianId: user._id,
    currentCustodianName: user.name,
    quantity: validated.outputBatch.quantity,
    initialQuantity: validated.outputBatch.quantity,
    unit: validated.outputBatch.unit,
    countryOfOrigin: validated.outputBatch.countryOfOrigin,
    regionOfOrigin: validated.outputBatch.regionOfOrigin,
    sourceLocation: validated.outputBatch.sourceLocation,
    extractionDate: new Date(),
    sourcingDeclarations: parents[0].sourcingDeclarations,
    status: "REGISTERED",
    initialEventHash: hashBytes32,
    blockchainStatus: "PENDING",
    parentBatchIds: validated.inputBatchIds,
    childBatchIds: [],
    qrCodeDataUrl: qr,
  });

  await outputBatch.save();

  // Create initial event for merged output
  await TraceabilityEvent.create({
    eventId: `EVT-${outputBatch.batchId}-00`,
    batchId: outputBatch.batchId,
    eventType: "MERGE",
    eventIndex: 0,
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    organization: user.organization,
    location: validated.outputBatch.sourceLocation,
    quantity: validated.outputBatch.quantity,
    unit: validated.outputBatch.unit,
    previousEventHash: parents[0].initialEventHash,
    eventHash: hashBytes32,
    canonicalData: canonicalMerge,
    verificationStatus: "VERIFIED",
    notes: `Merged from parents: ${validated.inputBatchIds.join(", ")}. Reason: ${validated.reason}`,
  });

  // Mark all parent batches as MERGED
  for (const parent of parents) {
    parent.status = "MERGED";
    parent.childBatchIds.push(outputBatch.batchId);
    await parent.save();

    await blockchainService.recordGenealogy(parent.batchId, outputBatch.batchId, "MERGE");
  }

  const genealogy = await Genealogy.create({
    operationType: "MERGE",
    parentBatchIds: validated.inputBatchIds,
    childBatchIds: [outputBatch.batchId],
    records: [
      ...parents.map((p) => ({
        batchId: p.batchId,
        role: "PARENT" as const,
        quantity: p.quantity,
        unit: p.unit,
      })),
      {
        batchId: outputBatch.batchId,
        role: "CHILD" as const,
        quantity: outputBatch.quantity,
        unit: outputBatch.unit,
      },
    ],
    operatorId: user._id,
    operatorName: user.name,
    reason: validated.reason,
  });

  return res.status(201).json({
    success: true,
    message: `Batches [${validated.inputBatchIds.join(", ")}] merged into ${outputBatch.batchId}.`,
    data: {
      outputBatch,
      genealogy,
    },
  });
};
