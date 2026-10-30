import { TraceabilityEvent, ITraceabilityEvent } from "../models/TraceabilityEvent";
import { Batch } from "../models/Batch";
import { AuditLog } from "../models/AuditLog";
import { hashCanonicalEventData } from "../utils/canonicalHash";
import { blockchainService, VerificationResult } from "./blockchainService";

export interface EventIntegrityReport {
  eventId: string;
  batchId: string;
  eventType: string;
  eventIndex: number;
  storedHash: string;
  recalculatedHash: string;
  isDbIntact: boolean; // Recalculated hash matches stored DB hash
  isOnChainRecorded: boolean; // Recorded on smart contract
  matchesBlockchain: boolean; // Stored hash matches on-chain anchor
  onChainHash?: string;
  blockchainStatus: "CONFIRMED" | "PENDING" | "OFFLINE";
  status: "SECURE_VERIFIED" | "DB_TAMPERED" | "BLOCKCHAIN_MISMATCH" | "OFFLINE_UNANCHORED";
  tamperDetails?: string;
  timestamp: Date;
}

export interface BatchIntegritySummary {
  batchId: string;
  overallStatus: "INTACT" | "TAMPERED_DETECTED" | "PARTIALLY_VERIFIED";
  totalEvents: number;
  verifiedEventsCount: number;
  tamperedEventsCount: number;
  eventsReport: EventIntegrityReport[];
  checkedAt: Date;
}

export class TamperAuditService {
  /**
   * Verify integrity of a single traceability event
   */
  public static async verifyEventIntegrity(
    event: ITraceabilityEvent
  ): Promise<EventIntegrityReport> {
    // 1. Recalculate canonical hash from stored canonicalData
    const { hashHex, hashBytes32 } = hashCanonicalEventData(event.canonicalData);

    const isDbIntact = hashHex.toLowerCase() === event.eventHash.replace(/^0x/, "").toLowerCase();

    // 2. Query blockchain smart contract
    let onChainResult: VerificationResult = {
      isAvailable: false,
      matchesOnChain: false,
    };

    if (event.blockchainStatus === "CONFIRMED" && event.blockchainTxHash) {
      onChainResult = await blockchainService.verifyEventHash(
        event.batchId,
        event.eventIndex,
        hashBytes32
      );
    }

    let status: "SECURE_VERIFIED" | "DB_TAMPERED" | "BLOCKCHAIN_MISMATCH" | "OFFLINE_UNANCHORED" =
      "OFFLINE_UNANCHORED";
    let tamperDetails: string | undefined;

    if (!isDbIntact) {
      status = "DB_TAMPERED";
      tamperDetails = `Database event data has been altered! Recalculated SHA-256 (${hashHex}) does not match recorded DB hash (${event.eventHash}).`;
    } else if (onChainResult.isAvailable) {
      if (onChainResult.matchesOnChain) {
        status = "SECURE_VERIFIED";
      } else {
        status = "BLOCKCHAIN_MISMATCH";
        tamperDetails = `Cryptographic mismatch! Database hash does not match immutable on-chain record: On-chain (${onChainResult.onChainHash}) vs Database (${hashBytes32}).`;
      }
    } else {
      status = "OFFLINE_UNANCHORED";
    }

    return {
      eventId: event.eventId,
      batchId: event.batchId,
      eventType: event.eventType,
      eventIndex: event.eventIndex,
      storedHash: event.eventHash,
      recalculatedHash: hashHex,
      isDbIntact,
      isOnChainRecorded: event.blockchainStatus === "CONFIRMED",
      matchesBlockchain: onChainResult.matchesOnChain,
      onChainHash: onChainResult.onChainHash,
      blockchainStatus: event.blockchainStatus,
      status,
      tamperDetails,
      timestamp: event.timestamp,
    };
  }

  /**
   * Run full cryptographic audit across all events in a batch
   */
  public static async verifyBatchIntegrity(batchId: string): Promise<BatchIntegritySummary> {
    const events = await TraceabilityEvent.find({ batchId }).sort({ eventIndex: 1 });
    const reports: EventIntegrityReport[] = [];

    let tamperedCount = 0;
    let verifiedCount = 0;

    for (const evt of events) {
      const report = await this.verifyEventIntegrity(evt);
      reports.push(report);

      if (report.status === "DB_TAMPERED" || report.status === "BLOCKCHAIN_MISMATCH") {
        tamperedCount++;
        // Update event verification status in DB
        evt.verificationStatus = "TAMPERED";
        await evt.save();
      } else if (report.status === "SECURE_VERIFIED") {
        verifiedCount++;
        evt.verificationStatus = "VERIFIED";
        await evt.save();
      }
    }

    const overallStatus: "INTACT" | "TAMPERED_DETECTED" | "PARTIALLY_VERIFIED" =
      tamperedCount > 0
        ? "TAMPERED_DETECTED"
        : verifiedCount === events.length && events.length > 0
        ? "INTACT"
        : "PARTIALLY_VERIFIED";

    // If tampered, log an audit alert and flag the batch
    if (tamperedCount > 0) {
      await Batch.updateOne(
        { batchId },
        {
          isFlagged: true,
          flagReason: `Cryptographic audit detected ${tamperedCount} altered or non-matching event records.`,
        }
      );

      await AuditLog.create({
        action: "TAMPER_DETECTED",
        targetResource: "Batch",
        targetId: batchId,
        severity: "CRITICAL",
        isTamperAlert: true,
        details: {
          tamperedCount,
          reports: reports.filter((r) => r.status === "DB_TAMPERED" || r.status === "BLOCKCHAIN_MISMATCH"),
        },
      });
    }

    return {
      batchId,
      overallStatus,
      totalEvents: events.length,
      verifiedEventsCount: verifiedCount,
      tamperedEventsCount: tamperedCount,
      eventsReport: reports,
      checkedAt: new Date(),
    };
  }
}
