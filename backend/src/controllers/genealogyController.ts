import { Request, Response } from "express";
import { Batch } from "../models/Batch";
import { Genealogy } from "../models/Genealogy";

export const getBatchGenealogy = async (req: Request, res: Response) => {
  const { batchId } = req.params;

  const currentBatch = await Batch.findOne({ batchId });
  if (!currentBatch) {
    return res.status(404).json({ success: false, message: `Batch '${batchId}' not found.` });
  }

  // Find all genealogy operations where this batch is parent or child
  const operations = await Genealogy.find({
    $or: [{ parentBatchIds: batchId }, { childBatchIds: batchId }],
  }).sort({ timestamp: 1 });

  // Gather all related batch IDs
  const relatedBatchIds = new Set<string>([batchId]);
  operations.forEach((op) => {
    op.parentBatchIds.forEach((id) => relatedBatchIds.add(id));
    op.childBatchIds.forEach((id) => relatedBatchIds.add(id));
  });

  const batches = await Batch.find({ batchId: { $in: Array.from(relatedBatchIds) } });
  const batchMap = new Map(batches.map((b) => [b.batchId, b]));

  // Build nodes & edges
  const nodes = Array.from(relatedBatchIds).map((id) => {
    const b = batchMap.get(id);
    return {
      id,
      label: b ? `${b.materialName} (${b.batchId})` : id,
      materialName: b?.materialName || "Unknown",
      materialCategory: b?.materialCategory || "Unknown",
      quantity: b?.quantity || 0,
      unit: b?.unit || "",
      status: b?.status || "UNKNOWN",
      isCurrent: id === batchId,
      isFlagged: b?.isFlagged || false,
    };
  });

  const edges: { from: string; to: string; label: string; operation: string; timestamp: Date }[] = [];
  operations.forEach((op) => {
    op.parentBatchIds.forEach((parent) => {
      op.childBatchIds.forEach((child) => {
        edges.push({
          from: parent,
          to: child,
          label: `${op.operationType}: ${op.reason}`,
          operation: op.operationType,
          timestamp: op.timestamp,
        });
      });
    });
  });

  return res.json({
    success: true,
    data: {
      targetBatchId: batchId,
      nodes,
      edges,
      operations,
    },
  });
};
