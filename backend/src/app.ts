import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";

// Route imports
import authRoutes from "./routes/authRoutes";
import supplierRoutes from "./routes/supplierRoutes";
import batchRoutes from "./routes/batchRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import genealogyRoutes from "./routes/genealogyRoutes";
import auditRoutes from "./routes/auditRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import blockchainRoutes from "./routes/blockchainRoutes";
import publicRoutes from "./routes/publicRoutes";

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost or standard local dev origins
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads serving
app.use("/uploads", express.static(config.uploadDir));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Responsible Raw Material Traceability API",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/genealogy", genealogyRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/public", publicRoutes);

// Error Handler
app.use(errorHandler);

export default app;
