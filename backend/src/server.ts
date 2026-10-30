import mongoose from "mongoose";
import app from "./app";
import { config } from "./config";
import { blockchainService } from "./services/blockchainService";

async function startServer() {
  try {
    console.log(`Connecting to MongoDB at: ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri);
    console.log("MongoDB connection established successfully.");

    // Check blockchain connection
    const chainReady = await blockchainService.isAvailable();
    if (chainReady) {
      console.log(`Blockchain local EVM node connected at: ${config.blockchainRpcUrl}`);
    } else {
      console.warn(
        `Blockchain node unreachable at ${config.blockchainRpcUrl}. Running in graceful offline mode.`
      );
    }

    app.listen(config.port, () => {
      console.log(`Responsible Raw Material Traceability API running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
