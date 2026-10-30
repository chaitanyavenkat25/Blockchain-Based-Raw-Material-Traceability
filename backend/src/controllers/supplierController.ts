import { Response } from "express";
import { Supplier } from "../models/Supplier";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
  const { status, search } = req.query;
  const filter: any = {};

  if (status) {
    filter.complianceStatus = status;
  }
  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
      { registrationNumber: { $regex: search, $options: "i" } },
    ];
  }

  const suppliers = await Supplier.find(filter)
    .populate("userId", "name email organization status")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  return res.json({ success: true, count: suppliers.length, data: suppliers });
};

export const getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const supplier = await Supplier.findById(id)
    .populate("userId", "name email organization status phone ethereumAddress")
    .populate("reviewedBy", "name email");

  if (!supplier) {
    return res.status(404).json({ success: false, message: "Supplier not found." });
  }

  return res.json({ success: true, data: supplier });
};

export const updateSupplierStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;

  if (!["APPROVED", "REJECTED", "PENDING_APPROVAL"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid compliance status." });
  }

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    return res.status(404).json({ success: false, message: "Supplier not found." });
  }

  supplier.complianceStatus = status;
  supplier.reviewNotes = reviewNotes || supplier.reviewNotes;
  supplier.reviewedBy = req.user!._id;
  supplier.reviewedAt = new Date();
  await supplier.save();

  // Also update corresponding User status
  const userStatus = status === "APPROVED" ? "ACTIVE" : status === "REJECTED" ? "REJECTED" : "PENDING_APPROVAL";
  await User.findByIdAndUpdate(supplier.userId, { status: userStatus });

  await AuditLog.create({
    action: "SUPPLIER_STATUS_UPDATED",
    actorId: req.user!._id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    targetResource: "Supplier",
    targetId: supplier._id.toString(),
    details: {
      previousStatus: supplier.complianceStatus,
      newStatus: status,
      reviewNotes,
    },
    severity: status === "REJECTED" ? "WARNING" : "INFO",
  });

  return res.json({
    success: true,
    message: `Supplier status successfully updated to ${status}.`,
    data: supplier,
  });
};
