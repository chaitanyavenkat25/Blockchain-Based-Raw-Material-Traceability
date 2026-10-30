import { Router } from "express";
import { getTransactionDetails, getBlockchainStatus } from "../controllers/blockchainController";

const router = Router();

router.get("/status", getBlockchainStatus);
router.get("/transactions/:hash", getTransactionDetails);

export default router;
