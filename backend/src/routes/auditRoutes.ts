import { Router } from "express";
import { getAuditLogs, flagBatch } from "../controllers/auditController";
import { authenticateJwt, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateJwt);

router.get("/", authorizeRoles("ADMIN", "AUDITOR"), getAuditLogs);
router.post("/flags/:id", authorizeRoles("ADMIN", "AUDITOR"), flagBatch);

export default router;
