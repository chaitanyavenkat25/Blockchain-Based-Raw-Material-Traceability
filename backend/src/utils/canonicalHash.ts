import crypto from "crypto";

/**
 * Deterministically serialize an object into a canonical JSON string
 * with alphabetically sorted keys and no unnecessary whitespace.
 */
export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonStringify).join(",") + "]";
  }

  const sortedKeys = Object.keys(obj).sort();
  const parts: string[] = [];

  for (const key of sortedKeys) {
    if (obj[key] !== undefined) {
      parts.push(JSON.stringify(key) + ":" + canonicalJsonStringify(obj[key]));
    }
  }

  return "{" + parts.join(",") + "}";
}

/**
 * Calculate standard SHA-256 hash of a string or buffer.
 */
export function sha256(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Calculate SHA-256 hash as a 0x-prefixed 32-byte hex string for EVM bytes32 compatibility.
 */
export function sha256Bytes32(data: string | Buffer): string {
  return "0x" + sha256(data);
}

/**
 * Canonical event hashing: sorts normalized event fields and computes SHA-256.
 */
export function hashCanonicalEventData(eventData: Record<string, any>): {
  canonicalString: string;
  hashHex: string;
  hashBytes32: string;
} {
  const canonicalString = canonicalJsonStringify(eventData);
  const hashHex = sha256(canonicalString);
  const hashBytes32 = "0x" + hashHex;
  return { canonicalString, hashHex, hashBytes32 };
}

/**
 * Calculate SHA-256 of file buffer
 */
export function hashFileBuffer(buffer: Buffer): {
  hashHex: string;
  hashBytes32: string;
} {
  const hashHex = crypto.createHash("sha256").update(buffer).digest("hex");
  return { hashHex, hashBytes32: "0x" + hashHex };
}
