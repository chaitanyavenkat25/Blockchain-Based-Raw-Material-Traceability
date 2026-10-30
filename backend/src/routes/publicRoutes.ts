import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getPublicBatchVerification } from "../controllers/publicController";

const router = Router();

// Rate limiting on public endpoint
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many public verification requests, please try again later." },
});

router.get("/batches/:batchId", publicLimiter, getPublicBatchVerification);

export default router;
