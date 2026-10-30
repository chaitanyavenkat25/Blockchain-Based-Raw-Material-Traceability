import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { config } from "../config";

describe("Backend REST API Integration Tests", () => {
  let adminToken: string;
  let supplierToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    // Login as Admin
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@traceability.org", password: "Admin@12345" });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // Login as Supplier
    const supplierRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "supplier@atacama-lithium.com", password: "Supplier@12345" });
    expect(supplierRes.status).toBe(200);
    supplierToken = supplierRes.body.data.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("System & Auth Endpoints", () => {
    it("GET /health should return 200 OK", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });

    it("POST /api/auth/login should reject invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "wrong@email.com", password: "WrongPassword1" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/auth/me should return authenticated user profile", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("admin@traceability.org");
      expect(res.body.data.user.role).toBe("ADMIN");
    });
  });

  describe("Batch Management & Traceability", () => {
    it("GET /api/batches should return seeded batches list", async () => {
      const res = await request(app).get("/api/batches");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("GET /api/batches/:id should return details for lithium batch", async () => {
      const res = await request(app).get("/api/batches/BATCH-LITH-2026-001");
      expect(res.status).toBe(200);
      expect(res.body.data.batch.batchId).toBe("BATCH-LITH-2026-001");
      expect(res.body.data.batch.countryOfOrigin).toBe("Chile");
    });

    it("GET /api/batches/:id/traceability should return chronological events", async () => {
      const res = await request(app).get("/api/batches/BATCH-LITH-2026-001/traceability");
      expect(res.status).toBe(200);
      expect(res.body.data.events.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data.events[0].eventType).toBe("EXTRACTION_REGISTRATION");
    });

    it("GET /api/batches/:id/verify should perform cryptographic integrity audit", async () => {
      const res = await request(app).get("/api/batches/BATCH-LITH-2026-001/verify");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.batchId).toBe("BATCH-LITH-2026-001");
      expect(res.body.data.totalEvents).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(res.body.data.eventsReport)).toBe(true);
      // All events in seeded data are mathematically intact
      res.body.data.eventsReport.forEach((evt: any) => {
        expect(evt.isDbIntact).toBe(true);
      });
    });
  });

  describe("Public Verification & QR Code Landing", () => {
    it("GET /api/public/batches/:batchId should return sanitized public payload without auth", async () => {
      const res = await request(app).get("/api/public/batches/BATCH-LITH-2026-001");
      expect(res.status).toBe(200);
      expect(res.body.data.batch.batchId).toBe("BATCH-LITH-2026-001");
      expect(res.body.data.supplier.accreditationStatus).toBe("APPROVED");
      expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data.disclaimer).toBeDefined();
    });

    it("GET /api/public/batches/NON-EXISTENT should return 404", async () => {
      const res = await request(app).get("/api/public/batches/NON-EXISTENT-XYZ");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Genealogy Graph", () => {
    it("GET /api/genealogy/:batchId should return nodes and edges for split batches", async () => {
      const res = await request(app).get("/api/genealogy/BATCH-LITH-2026-001");
      expect(res.status).toBe(200);
      expect(res.body.data.targetBatchId).toBe("BATCH-LITH-2026-001");
      expect(res.body.data.nodes.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data.edges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Analytics & Dashboard Metrics", () => {
    it("GET /api/analytics/dashboard should return system metrics for authenticated user", async () => {
      const res = await request(app)
        .get("/api/analytics/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.overview.totalBatches).toBeGreaterThanOrEqual(4);
      expect(res.body.data.categoryDistribution.length).toBeGreaterThan(0);
      expect(res.body.data.claimsBreakdown).toBeDefined();
    });
  });
});
