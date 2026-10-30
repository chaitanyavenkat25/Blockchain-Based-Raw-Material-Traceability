import { Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { Batch } from "../models/Batch";
import { TraceabilityEvent } from "../models/TraceabilityEvent";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { flagBatchSchema } from "../validators";
import { hashCanonicalEventData } from "../utils/canonicalHash";
import { blockchainService } from "../services/blockchainService";

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  const { severity, isTamperAlert, limit = "50" } = req.query;
  const filter: any = {};

  if (severity) filter.severity = severity;
  if (isTamperAlert !== undefined) filter.isTamperAlert = isTamperAlert === "true";

  const l = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(l)
    .populate("actorId", "name email role organization");

  return res.json({ success: true, count: logs.length, data: logs });
};

export const flagBatch = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = flagBatchSchema.parse(req.body);
  const user = req.user!;

  const batch = await Batch.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }] });
  if (!batch) {
    return res.status(404).json({ success: false, message: "Batch not found." });
  }

  batch.isFlagged = true;
  batch.flagReason = validated.reason;
  batch.status = "FLAGGED";
  await batch.save();

  // Append AUDIT_FLAG event into batch traceability history
  const lastEvent = await TraceabilityEvent.findOne({ batchId: batch.batchId }).sort({ eventIndex: -1 });
  const prevHash = lastEvent ? lastEvent.eventHash : "0x0000000000000000000000000000000000000000000000000000000000000000";
  const nextIndex = lastEvent ? lastEvent.eventIndex + 1 : 0;
  const eventId = `EVT-${batch.batchId}-${String(nextIndex).padStart(2, "0")}`;

  const canonicalFlag = {
    batchId: batch.batchId,
    eventId,
    eventType: "AUDIT_FLAG",
    flaggedBy: user.email,
    flaggedRole: user.role,
    notes: validated.reason,
    previousEventHash: prevHash,
    severity: validated.severity,
  };
  const { hashBytes32 } = hashCanonicalEventData(canonicalFlag);

  const event = new TraceabilityEvent({
    eventId,
    batchId: batch.batchId,
    eventType: "AUDIT_FLAG",
    eventIndex: nextIndex,
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    organization: user.organization,
    location: batch.sourceLocation,
    previousEventHash: prevHash,
    eventHash: hashBytes32,
    canonicalData: canonicalFlag,
    verificationStatus: "VERIFIED",
    notes: validated.reason,
    timestamp: new Date(),
  });

  const chainResult = await blockchainService.recordEvent(
    batch.batchId,
    eventId,
    "AUDIT_FLAG",
    hashBytes32,
    prevHash
  );
  event.blockchainStatus = chainResult.status;
  if (chainResult.txHash) {
    event.blockchainTxHash = chainResult.txHash;
    event.blockchainBlockNumber = chainResult.blockNumber;
  }
  await event.save();

  await AuditLog.create({
    action: "BATCH_FLAGGED_BY_AUDITOR",
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    targetResource: "Batch",
    targetId: batch.batchId,
    details: {
      reason: validated.reason,
      severity: validated.severity,
      eventId,
      blockchainTxHash: chainResult.txHash,
    },
    severity: validated.severity,
  });

  return res.json({
    success: true,
    message: `Batch ${batch.batchId} has been successfully flagged. Historical audit event appended.`,
    data: {
      batch,
      event,
    },
  });
};
