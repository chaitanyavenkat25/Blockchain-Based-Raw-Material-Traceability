import { Response } from "express";
import { Batch } from "../models/Batch";
import { TraceabilityEvent } from "../models/TraceabilityEvent";
import { Certificate } from "../models/Certificate";
import { Supplier } from "../models/Supplier";
import { AuditLog } from "../models/AuditLog";
import { blockchainService } from "../services/blockchainService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;

  // 1. Overall batch counts
  const totalBatches = await Batch.countDocuments();
  const inTransitBatches = await Batch.countDocuments({ status: "IN_TRANSIT" });
  const manufacturedBatches = await Batch.countDocuments({ status: "MANUFACTURED" });
  const flaggedBatches = await Batch.countDocuments({ isFlagged: true });
  const registeredBatches = await Batch.countDocuments({ status: "REGISTERED" });
  const processingBatches = await Batch.countDocuments({ status: "PROCESSING" });

  // 2. Pending reviews
  const pendingSuppliers = await Supplier.countDocuments({ complianceStatus: "PENDING_APPROVAL" });
  const approvedSuppliers = await Supplier.countDocuments({ complianceStatus: "APPROVED" });
  const pendingCertificates = await Certificate.countDocuments({
    status: { $in: ["SUBMITTED", "PENDING_VERIFICATION"] },
  });
  const verifiedCertificates = await Certificate.countDocuments({ status: "VERIFIED" });
  const rejectedCertificates = await Certificate.countDocuments({ status: "REJECTED" });
  const disputedCertificates = await Certificate.countDocuments({ status: "DISPUTED" });

  // 3. Category distribution
  const categoryAgg = await Batch.aggregate([
    { $group: { _id: "$materialCategory", count: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } },
    { $project: { category: "$_id", count: 1, totalQuantity: 1, _id: 0 } },
  ]);

  // 4. Sourcing claims breakdown
  const environmentalDeclared = await Batch.countDocuments({ "sourcingDeclarations.environmentalCompliance": true });
  const laborRightsDeclared = await Batch.countDocuments({ "sourcingDeclarations.laborRightsCompliant": true });
  const conflictFreeDeclared = await Batch.countDocuments({ "sourcingDeclarations.conflictFreeDeclared": true });
  const recycledDeclared = await Batch.countDocuments({ "sourcingDeclarations.recycledOrRenewable": true });

  // 5. Blockchain health & metrics
  const isChainLive = await blockchainService.isAvailable();
  const confirmedEvents = await TraceabilityEvent.countDocuments({ blockchainStatus: "CONFIRMED" });
  const pendingEvents = await TraceabilityEvent.countDocuments({ blockchainStatus: "PENDING" });
  const offlineEvents = await TraceabilityEvent.countDocuments({ blockchainStatus: "OFFLINE" });

  // 6. Recent activity timeline
  const recentEvents = await TraceabilityEvent.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("actorId", "name role organization");

  const recentAuditLogs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(6);

  return res.json({
    success: true,
    data: {
      overview: {
        totalBatches,
        inTransitBatches,
        manufacturedBatches,
        flaggedBatches,
        registeredBatches,
        processingBatches,
        pendingSuppliers,
        approvedSuppliers,
        pendingCertificates,
        verifiedCertificates,
        rejectedCertificates,
        disputedCertificates,
      },
      categoryDistribution: categoryAgg,
      claimsBreakdown: {
        environmental: environmentalDeclared,
        laborRights: laborRightsDeclared,
        conflictFree: conflictFreeDeclared,
        recycledOrRenewable: recycledDeclared,
        verifiedCertificates,
        unverifiedOrPending: pendingCertificates + rejectedCertificates + disputedCertificates,
      },
      blockchain: {
        isAvailable: isChainLive,
        confirmedEvents,
        pendingEvents,
        offlineEvents,
        totalEvents: confirmedEvents + pendingEvents + offlineEvents,
      },
      recentActivity: recentEvents,
      recentAuditLogs,
    },
  });
};
