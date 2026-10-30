import { Router } from "express";
import {
  uploadCertificate,
  getCertificates,
  reviewCertificate,
} from "../controllers/certificateController";
import { authenticateJwt, authorizeRoles } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

router.use(authenticateJwt);

router.post("/", upload.single("file"), uploadCertificate);
router.get("/", getCertificates);
router.patch("/:id/review", authorizeRoles("ADMIN", "AUDITOR"), reviewCertificate);

export default router;
