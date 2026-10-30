import { Router } from "express";
import { getBatchGenealogy } from "../controllers/genealogyController";

const router = Router();

router.get("/:batchId", getBatchGenealogy);

export default router;
