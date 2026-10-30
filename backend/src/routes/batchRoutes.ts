import { Router } from "express";
import {
  createBatch,
  getBatches,
  getBatchById,
  getBatchTraceability,
  addEvent,
  verifyBatchIntegrity,
  simulateTamper,
  splitBatch,
  mergeBatches,
} from "../controllers/batchController";
import { authenticateJwt, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

// Publicly viewable or authenticated
router.get("/", getBatches);
router.get("/:id", getBatchById);
router.get("/:id/traceability", getBatchTraceability);
router.get("/:id/verify", verifyBatchIntegrity);

// Protected routes
router.use(authenticateJwt);

router.post("/", authorizeRoles("SUPPLIER", "ADMIN"), createBatch);
router.post("/:id/events", authorizeRoles("SUPPLIER", "MANUFACTURER", "AUDITOR", "ADMIN"), addEvent);
router.post("/:id/split", authorizeRoles("SUPPLIER", "MANUFACTURER", "ADMIN"), splitBatch);
router.post("/merge", authorizeRoles("MANUFACTURER", "ADMIN"), mergeBatches);
router.post("/:id/simulate-tamper", authorizeRoles("ADMIN", "AUDITOR"), simulateTamper);

export default router;
