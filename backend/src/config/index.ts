import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

let contractArtifact: any = null;
const artifactPath = path.join(__dirname, "contractArtifact.json");
if (fs.existsSync(artifactPath)) {
  try {
    contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  } catch (err) {
    console.warn("Could not parse contractArtifact.json:", err);
  }
}

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rawmaterial_traceability",
  jwtSecret: process.env.JWT_SECRET || "super_secret_jwt_key_rawmaterial_2026_academic_demo",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
  blockchainPrivateKey:
    process.env.BLOCKCHAIN_PRIVATE_KEY ||
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  contractAddress:
    process.env.CONTRACT_ADDRESS ||
    contractArtifact?.address ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  contractAbi: contractArtifact?.abi || [],
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  uploadDir: path.join(__dirname, "../../uploads"),
};
