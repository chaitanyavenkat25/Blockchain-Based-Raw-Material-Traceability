import { Request, Response } from "express";
import { Batch } from "../models/Batch";
import { TraceabilityEvent } from "../models/TraceabilityEvent";
import { Certificate } from "../models/Certificate";
import { Supplier } from "../models/Supplier";
import { TamperAuditService } from "../services/tamperAuditService";

export const getPublicBatchVerification = async (req: Request, res: Response) => {
  const { batchId } = req.params;

  const batch = await Batch.findOne({ batchId });
  if (!batch) {
    return res.status(404).json({
      success: false,
      message: `Batch '${batchId}' could not be found in the traceability registry.`,
    });
  }

  // Fetch supplier compliance status
  const supplier = await Supplier.findOne({ userId: batch.supplierId });

  // Fetch append-only public event timeline (sanitized)
  const events = await TraceabilityEvent.find({ batchId })
    .sort({ eventIndex: 1 })
    .select(
      "eventId eventType eventIndex organization location quantity unit timestamp eventHash previousEventHash blockchainTxHash blockchainBlockNumber blockchainStatus verificationStatus notes"
    );

  // Fetch public verified/submitted certificates
  const certificates = await Certificate.find({ batchId }).select(
    "certificateName certificateType certificateNumber issuer issueDate expiryDate scope sourcingClaims documentHash status blockchainTxHash reviewerNotes reviewedAt"
  );

  // Run integrity verification
  const integrity = await TamperAuditService.verifyBatchIntegrity(batchId);

  // Determine warnings
  const warnings: string[] = [];
  if (batch.isFlagged) {
    warnings.push(`Warning: This batch has been officially flagged: ${batch.flagReason || "Auditor inspection inquiry"}`);
  }
  if (!supplier || supplier.complianceStatus !== "APPROVED") {
    warnings.push("Notice: Origin supplier accreditation is pending or unverified.");
  }
  const unverifiedCerts = certificates.filter((c) => c.status !== "VERIFIED");
  if (unverifiedCerts.length > 0) {
    warnings.push(`Notice: ${unverifiedCerts.length} submitted sustainability certificates are pending independent audit verification.`);
  }
  const disputedCerts = certificates.filter((c) => c.status === "DISPUTED" || c.status === "REJECTED");
  if (disputedCerts.length > 0) {
    warnings.push(`Warning: ${disputedCerts.length} claim(s) have been rejected or marked disputed by accredited auditors.`);
  }
  if (integrity.overallStatus === "TAMPERED_DETECTED") {
    warnings.push("CRITICAL ALERT: Cryptographic mismatch detected between off-chain database and blockchain ledger!");
  }

  return res.json({
    success: true,
    data: {
      batch: {
        batchId: batch.batchId,
        materialName: batch.materialName,
        materialCategory: batch.materialCategory,
        description: batch.description,
        quantity: batch.quantity,
        unit: batch.unit,
        countryOfOrigin: batch.countryOfOrigin,
        regionOfOrigin: batch.regionOfOrigin,
        sourceLocation: batch.sourceLocation,
        extractionDate: batch.extractionDate,
        sourcingDeclarations: batch.sourcingDeclarations,
        status: batch.status,
        blockchainStatus: batch.blockchainStatus,
        initialBlockchainTxHash: batch.initialBlockchainTxHash,
        initialEventHash: batch.initialEventHash,
        isFlagged: batch.isFlagged,
        flagReason: batch.flagReason,
      },
      supplier: {
        name: batch.supplierName,
        accreditationStatus: supplier ? supplier.complianceStatus : "UNVERIFIED",
        country: supplier?.country || batch.countryOfOrigin,
        region: supplier?.region || batch.regionOfOrigin,
        facilityType: supplier?.facilityType || "Extraction Facility",
      },
      timeline: events,
      certificates,
      integrity: {
        overallStatus: integrity.overallStatus,
        totalEvents: integrity.totalEvents,
        verifiedEventsCount: integrity.verifiedEventsCount,
        tamperedEventsCount: integrity.tamperedEventsCount,
        checkedAt: integrity.checkedAt,
      },
      warnings,
      disclaimer:
        "Blockchain cryptographic hashes confirm that the recorded event data and document hashes have not been modified since anchoring. Independent auditor verification is required to establish real-world physical compliance.",
    },
  });
};
