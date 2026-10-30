import { Request, Response } from "express";
import { blockchainService } from "../services/blockchainService";
import { config } from "../config";

export const getTransactionDetails = async (req: Request, res: Response) => {
  const { hash } = req.params;

  if (!hash || !hash.startsWith("0x")) {
    return res.status(400).json({ success: false, message: "Invalid transaction hash format." });
  }

  const txDetails = await blockchainService.getTransactionDetails(hash);
  if (!txDetails) {
    return res.status(404).json({
      success: false,
      message: "Transaction not found on configured network or node is unreachable.",
    });
  }

  return res.json({ success: true, data: txDetails });
};

export const getBlockchainStatus = async (req: Request, res: Response) => {
  const isAvailable = await blockchainService.isAvailable();
  return res.json({
    success: true,
    data: {
      isAvailable,
      rpcUrl: config.blockchainRpcUrl,
      contractAddress: config.contractAddress,
      network: "Hardhat Local (EVM 31337)",
    },
  });
};
