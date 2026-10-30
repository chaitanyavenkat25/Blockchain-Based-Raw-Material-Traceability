import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["ADMIN", "SUPPLIER", "MANUFACTURER", "AUDITOR", "CONSUMER"]),
  organization: z.string().min(2, "Organization name is required"),
  ethereumAddress: z.string().optional(),
  phone: z.string().optional(),
  supplierProfile: z
    .object({
      companyName: z.string().min(2),
      registrationNumber: z.string().min(2),
      country: z.string().min(2),
      region: z.string().min(2),
      facilityType: z.string().min(2),
      sourcingCategories: z.array(z.string()).default([]),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createBatchSchema = z.object({
  batchId: z.string().min(3, "Batch ID must be at least 3 characters").optional(),
  materialName: z.string().min(2, "Material name is required"),
  materialCategory: z.string().min(2, "Material category is required"),
  description: z.string().min(5, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit of measurement is required"),
  countryOfOrigin: z.string().min(2, "Country of origin is required"),
  regionOfOrigin: z.string().min(2, "Region of origin is required"),
  sourceLocation: z.object({
    name: z.string().min(2, "Location name is required"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  extractionDate: z.string().or(z.date()),
  sourcingDeclarations: z
    .object({
      environmentalCompliance: z.boolean().default(false),
      laborRightsCompliant: z.boolean().default(false),
      conflictFreeDeclared: z.boolean().default(false),
      recycledOrRenewable: z.boolean().default(false),
      details: z.string().default(""),
    })
    .default({
      environmentalCompliance: false,
      laborRightsCompliant: false,
      conflictFreeDeclared: false,
      recycledOrRenewable: false,
      details: "",
    }),
});

export const createEventSchema = z.object({
  eventType: z.enum([
    "EXTRACTION_REGISTRATION",
    "INITIAL_INSPECTION",
    "PROCESSING",
    "CERTIFICATION_REVIEW",
    "TRANSPORTATION",
    "WAREHOUSE_RECEIPT",
    "MANUFACTURING",
    "SPLIT",
    "MERGE",
    "CUSTODY_TRANSFER",
    "AUDIT_FLAG",
    "CORRECTION",
  ]),
  location: z.object({
    name: z.string().min(2, "Location name is required"),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  evidenceDocumentHashes: z.array(z.string()).default([]),
  newCustodianId: z.string().optional(),
});

export const splitBatchSchema = z.object({
  childBatches: z
    .array(
      z.object({
        batchId: z.string().min(3),
        quantity: z.number().positive("Child batch quantity must be positive"),
        unit: z.string().min(1),
        description: z.string().default(""),
      })
    )
    .min(2, "Splitting requires at least 2 child batches"),
  reason: z.string().min(3, "Reason for split is required"),
});

export const mergeBatchSchema = z.object({
  inputBatchIds: z.array(z.string()).min(2, "Merging requires at least 2 input batches"),
  outputBatch: z.object({
    batchId: z.string().min(3),
    materialName: z.string().min(2),
    materialCategory: z.string().min(2),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    description: z.string().min(5),
    countryOfOrigin: z.string().min(2),
    regionOfOrigin: z.string().min(2),
    sourceLocation: z.object({
      name: z.string().min(2),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
  }),
  reason: z.string().min(3, "Reason for merge is required"),
});

export const reviewCertificateSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "DISPUTED"]),
  reviewerNotes: z.string().min(3, "Reviewer notes are required"),
});

export const flagBatchSchema = z.object({
  reason: z.string().min(5, "Flag reason must be at least 5 characters"),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).default("WARNING"),
});
