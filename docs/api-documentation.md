# REST API Documentation

Base URL: `http://localhost:5000/api`

All authenticated endpoints require an `Authorization: Bearer <token>` HTTP header.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Create a new user account with role-specific profile data.
- **Request Body:**
  ```json
  {
    "name": "Carlos Mendoza",
    "email": "supplier@atacama-lithium.com",
    "password": "Supplier@12345",
    "role": "SUPPLIER",
    "organization": "Atacama Clean Lithium Corp",
    "supplierProfile": {
      "companyName": "Atacama Clean Lithium Corp",
      "registrationNumber": "CL-MIN-2021-9988",
      "country": "Chile",
      "region": "Antofagasta",
      "facilityType": "Solar Brine Extraction",
      "sourcingCategories": ["Mineral", "Lithium"]
    }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Supplier registration submitted. Account is pending administrator approval.",
    "data": { "token": "jwt...", "user": { "id": "...", "name": "...", "role": "SUPPLIER", "status": "PENDING_APPROVAL" } }
  }
  ```

### `POST /api/auth/login`
Authenticate user and return JWT access token.
- **Request Body:** `{ "email": "admin@traceability.org", "password": "Admin@12345" }`
- **Response (200 OK):** `{ "success": true, "data": { "token": "jwt...", "user": { ... } } }`

### `GET /api/auth/me`
Retrieve currently authenticated user profile and permissions.

---

## 2. Batches & Traceability Endpoints

### `GET /api/batches`
List batches with optional filters (`category`, `status`, `search`, `page`, `limit`).

### `POST /api/batches` (Role: SUPPLIER, ADMIN)
Register a newly extracted/collected raw material batch.
- **Request Body:**
  ```json
  {
    "batchId": "BATCH-LITH-2026-001",
    "materialName": "Battery-Grade Lithium Hydroxide (LiOH)",
    "materialCategory": "Mineral",
    "description": "Solar brine extraction from Salar de Atacama.",
    "quantity": 10000,
    "unit": "kg",
    "countryOfOrigin": "Chile",
    "regionOfOrigin": "Antofagasta",
    "sourceLocation": { "name": "Salar de Atacama Basin 4B", "latitude": -23.499, "longitude": -68.329 },
    "extractionDate": "2026-01-10",
    "sourcingDeclarations": {
      "environmentalCompliance": true,
      "laborRightsCompliant": true,
      "conflictFreeDeclared": true,
      "recycledOrRenewable": false,
      "details": "Zero unauthorized groundwater extraction."
    }
  }
  ```

### `GET /api/batches/:id`
Retrieve full batch metadata, current custodian, and certificate references.

### `GET /api/batches/:id/traceability`
Retrieve append-only chronological event history with cryptographic hash linkage.

### `POST /api/batches/:id/events` (Role: SUPPLIER, MANUFACTURER, AUDITOR, ADMIN)
Append a new traceability event to a batch.
- **Request Body:**
  ```json
  {
    "eventType": "TRANSPORTATION",
    "location": { "name": "Port of Mejillones Cargo Terminal", "country": "Chile" },
    "quantity": 10000,
    "unit": "kg",
    "notes": "Containerized sealed shipment loaded onto MV Green Horizon."
  }
  ```

### `GET /api/batches/:id/verify`
Run cryptographic audit: recalculates canonical SHA-256 for all events in DB and compares against on-chain smart contract anchor.

### `POST /api/batches/:id/simulate-tamper` (Role: ADMIN, AUDITOR)
*Academic Demo Endpoint:* alters an off-chain MongoDB field without updating the hash or on-chain ledger to demonstrate cryptographic fraud detection.

### `POST /api/batches/:id/split` (Role: MANUFACTURER, SUPPLIER, ADMIN)
Split a parent batch into child allocations with strict quantity conservation.

### `POST /api/batches/merge` (Role: MANUFACTURER, ADMIN)
Combine multiple parent batches into an output production lot.

---

## 3. Public Verification (Consumer QR Landing)

### `GET /api/public/batches/:batchId`
Unauthenticated, rate-limited public endpoint. Returns verified provenance timeline, supplier accreditation status, accredited certificates, on-chain transaction references, and safety advisories without exposing private commercial or personal data.

---

## 4. Certificates & Sourcing Claims

### `POST /api/certificates` (Multipart/form-data)
Submit certificate document file and metadata. System automatically computes document SHA-256.

### `GET /api/certificates`
List certificates filtered by `batchId` or `status`.

### `PATCH /api/certificates/:id/review` (Role: ADMIN, AUDITOR)
Approve or reject certificate. When set to `VERIFIED`, anchors document hash on-chain.
- **Request Body:** `{ "status": "VERIFIED", "reviewerNotes": "Passed third-party surveillance audit." }`

---

## 5. Blockchain Explorer & Audit Logs

### `GET /api/blockchain/status`
Returns RPC node connectivity, network chain ID, and contract address.

### `GET /api/blockchain/transactions/:hash`
Queries live EVM node for transaction receipt, block number, gas used, and status.

### `GET /api/audit-logs` (Role: ADMIN, AUDITOR)
Retrieve system audit trail and cryptographic tamper alerts.
