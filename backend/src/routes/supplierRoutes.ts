import { Router } from "express";
import {
  getSuppliers,
  getSupplierById,
  updateSupplierStatus,
} from "../controllers/supplierController";
import { authenticateJwt, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateJwt);

router.get("/", authorizeRoles("ADMIN", "AUDITOR", "MANUFACTURER"), getSuppliers);
router.get("/:id", authorizeRoles("ADMIN", "AUDITOR", "MANUFACTURER"), getSupplierById);
router.patch("/:id/status", authorizeRoles("ADMIN"), updateSupplierStatus);

export default router;
