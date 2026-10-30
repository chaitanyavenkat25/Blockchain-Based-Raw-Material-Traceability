import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/analyticsController";
import { authenticateJwt } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateJwt);

router.get("/dashboard", getDashboardAnalytics);

export default router;
