export type UserRole = "ADMIN" | "SUPPLIER" | "MANUFACTURER" | "AUDITOR" | "CONSUMER";
export type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  status: UserStatus;
  ethereumAddress?: string;
  phone?: string;
  createdAt?: string;
}

export type BatchStatus =
  | "REGISTERED"
  | "IN_TRANSIT"
  | "PROCESSING"
  | "MANUFACTURED"
  | "SPLIT"
  | "MERGED"
  | "FLAGGED";

export interface SourcingDeclarations {
  environmentalCompliance: boolean;
  laborRightsCompliant: boolean;
  conflictFreeDeclared: boolean;
  recycledOrRenewable: boolean;
  details: string;
}

export interface Batch {
  _id: string;
  batchId: string;
  materialName: string;
  materialCategory: string;
  description: string;
  supplierId: string | { _id: string; name: string; email: string; organization: string };
  supplierName: string;
  currentCustodianId: string | { _id: string; name: string; email: string; organization: string; role: string };
  currentCustodianName: string;
  quantity: number;
  initialQuantity: number;
  unit: string;
  countryOfOrigin: string;
  regionOfOrigin: string;
  sourceLocation: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  extractionDate: string;
  sourcingDeclarations: SourcingDeclarations;
  status: BatchStatus;
  isFlagged: boolean;
  flagReason?: string;
  initialEventHash: string;
  initialBlockchainTxHash?: string;
  blockchainStatus: "CONFIRMED" | "PENDING" | "OFFLINE";
  parentBatchIds: string[];
  childBatchIds: string[];
  qrCodeDataUrl?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TraceabilityEvent {
  _id: string;
  eventId: string;
  batchId: string;
  eventType: string;
  eventIndex: number;
  actorId: string | { _id: string; name: string; email: string; role: string; organization: string };
  actorName: string;
  actorRole: string;
  organization: string;
  location: {
    name: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  quantity?: number;
  unit?: string;
  previousEventHash: string;
  eventHash: string;
  canonicalData: Record<string, any>;
  blockchainTxHash?: string;
  blockchainBlockNumber?: number;
  blockchainStatus: "CONFIRMED" | "PENDING" | "OFFLINE";
  evidenceDocumentHashes: string[];
  verificationStatus: "VERIFIED" | "TAMPERED" | "UNVERIFIED";
  notes?: string;
  timestamp: string;
  isDemo?: boolean;
}

export type CertificateStatus =
  | "SUBMITTED"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "DISPUTED";

export interface Certificate {
  _id: string;
  batchId: string;
  materialName?: string;
  certificateType: string;
  certificateName: string;
  certificateNumber: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  scope: string;
  sourcingClaims: {
    environmental: boolean;
    laborHumanRights: boolean;
    conflictFree: boolean;
    recycledRenewable: boolean;
  };
  originalFileName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  documentHash: string;
  blockchainTxHash?: string;
  status: CertificateStatus;
  submittedById: string | { _id: string; name: string; email: string };
  submittedByName: string;
  reviewerId?: string | { _id: string; name: string };
  reviewerName?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface EventIntegrityReport {
  eventId: string;
  batchId: string;
  eventType: string;
  eventIndex: number;
  storedHash: string;
  recalculatedHash: string;
  isDbIntact: boolean;
  isOnChainRecorded: boolean;
  matchesBlockchain: boolean;
  onChainHash?: string;
  blockchainStatus: "CONFIRMED" | "PENDING" | "OFFLINE";
  status: "SECURE_VERIFIED" | "DB_TAMPERED" | "BLOCKCHAIN_MISMATCH" | "OFFLINE_UNANCHORED";
  tamperDetails?: string;
  timestamp: string;
}

export interface BatchIntegritySummary {
  batchId: string;
  overallStatus: "INTACT" | "TAMPERED_DETECTED" | "PARTIALLY_VERIFIED";
  totalEvents: number;
  verifiedEventsCount: number;
  tamperedEventsCount: number;
  eventsReport: EventIntegrityReport[];
  checkedAt: string;
}

export interface SupplierProfile {
  _id: string;
  userId: string | User;
  companyName: string;
  registrationNumber: string;
  country: string;
  region: string;
  facilityType: string;
  sourcingCategories: string[];
  complianceStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  reviewNotes?: string;
  reviewedBy?: string | { name: string; email: string };
  reviewedAt?: string;
  createdAt: string;
}

export interface DashboardAnalytics {
  overview: {
    totalBatches: number;
    inTransitBatches: number;
    manufacturedBatches: number;
    flaggedBatches: number;
    registeredBatches: number;
    processingBatches: number;
    pendingSuppliers: number;
    approvedSuppliers: number;
    pendingCertificates: number;
    verifiedCertificates: number;
    rejectedCertificates: number;
    disputedCertificates: number;
  };
  categoryDistribution: { category: string; count: number; totalQuantity: number }[];
  claimsBreakdown: {
    environmental: number;
    laborRights: number;
    conflictFree: number;
    recycledOrRenewable: number;
    verifiedCertificates: number;
    unverifiedOrPending: number;
  };
  blockchain: {
    isAvailable: boolean;
    confirmedEvents: number;
    pendingEvents: number;
    offlineEvents: number;
    totalEvents: number;
  };
  recentActivity: TraceabilityEvent[];
  recentAuditLogs: any[];
}
