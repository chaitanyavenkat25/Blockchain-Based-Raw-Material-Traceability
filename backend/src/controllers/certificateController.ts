import { Response } from "express";
import fs from "fs";
import { Certificate, ICertificate } from "../models/Certificate";
import { Batch } from "../models/Batch";
import { AuditLog } from "../models/AuditLog";
import { hashFileBuffer } from "../utils/canonicalHash";
import { blockchainService } from "../services/blockchainService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const uploadCertificate = async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: "Certificate file is required." });
  }

  const user = req.user!;
  const {
    batchId,
    certificateType,
    certificateName,
    certificateNumber,
    issuer,
    issueDate,
    expiryDate,
    scope,
    environmental,
    laborHumanRights,
    conflictFree,
    recycledRenewable,
  } = req.body;

  if (!batchId || !certificateName || !certificateNumber || !issuer || !issueDate || !expiryDate) {
    return res.status(400).json({
      success: false,
      message: "Missing required certificate metadata fields.",
    });
  }

  const batch = await Batch.findOne({ batchId });
  if (!batch) {
    return res.status(404).json({ success: false, message: `Batch '${batchId}' not found.` });
  }

  // Calculate cryptographic SHA-256 of file buffer
  const fileBuffer = fs.readFileSync(file.path);
  const { hashHex, hashBytes32 } = hashFileBuffer(fileBuffer);

  const cert = new Certificate({
    batchId,
    materialName: batch.materialName,
    certificateType: certificateType || "CUSTOM",
    certificateName,
    certificateNumber,
    issuer,
    issueDate: new Date(issueDate),
    expiryDate: new Date(expiryDate),
    scope: scope || "Responsible Sourcing & Traceability Compliance",
    sourcingClaims: {
      environmental: environmental === "true" || environmental === true,
      laborHumanRights: laborHumanRights === "true" || laborHumanRights === true,
      conflictFree: conflictFree === "true" || conflictFree === true,
      recycledRenewable: recycledRenewable === "true" || recycledRenewable === true,
    },
    originalFileName: file.originalname,
    filePath: file.filename,
    fileSizeBytes: file.size,
    mimeType: file.mimetype,
    documentHash: hashBytes32,
    status: "SUBMITTED",
    submittedById: user._id,
    submittedByName: user.name,
    isDemo: false,
  });

  await cert.save();

  await AuditLog.create({
    action: "CERTIFICATE_SUBMITTED",
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    targetResource: "Certificate",
    targetId: cert._id.toString(),
    details: {
      batchId,
      certificateNumber,
      issuer,
      documentHash: hashBytes32,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Certificate submitted successfully. Status is 'SUBMITTED' pending independent audit verification.",
    data: cert,
  });
};

export const getCertificates = async (req: AuthenticatedRequest, res: Response) => {
  const { batchId, status, certificateType } = req.query;
  const filter: any = {};

  if (batchId) filter.batchId = batchId;
  if (status) filter.status = status;
  if (certificateType) filter.certificateType = certificateType;

  const certificates = await Certificate.find(filter)
    .populate("submittedById", "name email organization role")
    .populate("reviewerId", "name email organization role")
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    count: certificates.length,
    data: certificates,
  });
};

export const reviewCertificate = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, reviewerNotes } = req.body;
  const user = req.user!;

  if (!["VERIFIED", "REJECTED", "DISPUTED", "PENDING_VERIFICATION"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid review status." });
  }

  const cert = await Certificate.findById(id);
  if (!cert) {
    return res.status(404).json({ success: false, message: "Certificate not found." });
  }

  cert.status = status;
  cert.reviewerId = user._id;
  cert.reviewerName = user.name;
  cert.reviewerNotes = reviewerNotes || "";
  cert.reviewedAt = new Date();

  // If approved as VERIFIED, anchor document hash on-chain
  let chainResult = null;
  if (status === "VERIFIED") {
    chainResult = await blockchainService.anchorDocumentHash(
      cert.batchId,
      cert.documentHash,
      `${cert.certificateType} - ${cert.certificateNumber} (${cert.issuer})`
    );
    if (chainResult.txHash) {
      cert.blockchainTxHash = chainResult.txHash;
    }
  }

  await cert.save();

  await AuditLog.create({
    action: "CERTIFICATE_REVIEWED",
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    targetResource: "Certificate",
    targetId: cert._id.toString(),
    details: {
      batchId: cert.batchId,
      newStatus: status,
      reviewerNotes,
      onChainTxHash: cert.blockchainTxHash,
    },
    severity: status === "REJECTED" || status === "DISPUTED" ? "WARNING" : "INFO",
  });

  return res.json({
    success: true,
    message: `Certificate status updated to ${status}.`,
    data: {
      certificate: cert,
      blockchainResult: chainResult,
    },
  });
};
