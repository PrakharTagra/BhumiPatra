# BhumiPatra - Shared Backend API

Production-ready, enterprise-grade REST API backend for **BhumiPatra — AI-Powered Intelligent Land Record Digitization & Validation System**.

The backend operates as an independent service responsible for handling user authentication, role-based access control (RBAC), multi-format document ingestion, autonomous AI pipeline orchestration, land record verification workflows, administrative analytics, and audit trailing.

---

## 🏛️ System Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               BhumiPatra REST API                      │
                                    │    (Express.js, Helmet, CORS, Rate Limiter)            │
                                    └──────────────────────────┬─────────────────────────────┘
                                                               │
                                  ┌────────────────────────────┼────────────────────────────┐
                                  ▼                            ▼                            ▼
                           [Auth & RBAC]              [Document Pipeline]           [Record Verification]
                     (JWT Bearer, bcryptjs)        (7-Stage Autonomous Engine)    (Officer Edits, Audit Trail)
                                  │                            │                            │
                                  ├────────────────────────────┼────────────────────────────┤
                                  │                            │                            │
                                  ▼                            ▼                            ▼
                      ┌───────────────────────┐   ┌──────────────────────────┐   ┌───────────────────────┐
                      │    MongoDB Models     │   │      Storage Layer       │   │    Audit Ledger       │
                      │ User, Document,       │   │ Pluggable Storage Driver │   │ Comprehensive audit   │
                      │ LandRecord, Logs      │   │ (Local Disk / S3 Ready)  │   │ logs for all actions  │
                      └───────────────────────┘   └──────────────────────────┘   └───────────────────────┘
```

---

## 🔐 User Roles & Permissions

The system implements 3 distinct operational roles enforced via reusable JWT & RBAC middleware:

| Role | Responsibilities | Permitted Endpoints |
|---|---|---|
| `DIGITIZATION_OPERATOR` | Uploads scanned land records (PDF, JPG, PNG, TIFF) and monitors autonomous AI processing. | `/api/documents/upload`, `/api/documents/:id/process`, `/api/documents*` |
| `VERIFICATION_OFFICER` | Inspects AI-extracted land parcels, edits discrepant fields with required rationale, approves, rejects, or sends records back. | `/api/land-records/pending`, `/api/land-records/:id/approve`, `/api/land-records/:id/reject`, `/api/land-records/:id/send-back` |
| `ADMIN` | Manages operator/officer user accounts, inspects system-wide audit logs, monitors live aggregated analytics. | `/api/admin/*`, all document and verification endpoints |

---

## ⚙️ Environment Variables

Create a `.env` file in the `/backend` directory based on `.env.example`:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bhumipatra

# Authentication Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Networking
PORT=5000
CLIENT_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Modular Storage
UPLOAD_DIR=uploads

# Autonomous Pipeline Providers
OCR_PROVIDER=tesseract
AI_PROVIDER=custom
```

### Supported Providers:
- **`OCR_PROVIDER`**: `tesseract`, `google-cloud-vision`, `aws-textract`, `azure-cv`, `custom`
  - *If `OCR_PROVIDER` is unset, the pipeline halts with a diagnostic status instead of returning fake data.*
- **`AI_PROVIDER`**: `openai`, `anthropic`, `google-gemini`, `huggingface`, `custom`
  - *If `AI_PROVIDER` is unset, the extraction stage halts with a diagnostic status instead of returning fake data.*

---

## 🚀 Installation & Running

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run in Development Mode (with hot-reload via nodemon)

```bash
npm run dev
```

### 3. Run in Production Mode

```bash
npm start
```

---

## 📡 REST API Contract

All endpoints adhere strictly to the standardized response envelope:

### Success Response:
```json
{
  "success": true,
  "data": {}
}
```

### Paginated List Response:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Human readable error message",
  "code": "ERROR_CODE"
}
```

---

### Endpoint Reference

#### Authentication
- `POST /api/auth/login` — Authenticate operator, officer, or admin (`email`, `password`).
- `GET /api/auth/me` — Retrieve active session profile.

#### Documents (`DIGITIZATION_OPERATOR`, `ADMIN`)
- `POST /api/documents/upload` — Ingest scanned file (`multipart/form-data`) + metadata (`documentType`, `state`, `district`, `tehsil`, `village`, `recordYear`).
- `GET /api/documents` — Query paginated documents with search, district, status, and type filters.
- `GET /api/documents/:id` — Full document inspection with extracted land records and logs.
- `POST /api/documents/:id/process` — Trigger or re-run the 7-stage autonomous AI pipeline.
- `GET /api/documents/:id/status` — Live stage status and diagnostic logs.

#### Land Records (`VERIFICATION_OFFICER`, `ADMIN`)
- `GET /api/land-records` — Query all extracted land records with pagination and filters.
- `GET /api/land-records/pending` — List records awaiting verification review (ordered by low confidence first).
- `GET /api/land-records/:id` — Inspect structured land parcels, tenure holders, and boundary data.
- `PUT /api/land-records/:id` — Correct extracted fields (logs every field mutation to `VerificationLog`).
- `POST /api/land-records/:id/approve` — Approve record and mark as verified.
- `POST /api/land-records/:id/reject` — Reject record with mandatory reason.
- `POST /api/land-records/:id/send-back` — Return record to digitization operator for re-scanning.
- `GET /api/land-records/:id/verification-history` — Full audit history of officer corrections.

#### Admin Management (`ADMIN`)
- `GET /api/admin/dashboard` — Live counts of users, documents, and records (zero dummy statistics).
- `GET /api/admin/analytics` — Aggregated distributions by document type, processing status, and confidence scores.
- `GET /api/admin/users` — Paginated user directory with role and status filters.
- `POST /api/admin/users` — Provision new operator, verification officer, or admin account.
- `PATCH /api/admin/users/:id/status` — Activate or deactivate user access.
- `GET /api/admin/documents` — Comprehensive system-wide document inspection.
- `GET /api/admin/audit-logs` — Query chronological audit trails of system activity.

---

## 🔄 Autonomous AI Pipeline Stages

The document digitization pipeline is modularly organized:

$$\text{Upload} \longrightarrow \text{Preprocessing} \longrightarrow \text{OCR} \longrightarrow \text{Field Extraction} \longrightarrow \text{Validation} \longrightarrow \text{Confidence Scoring} \longrightarrow \text{Verification}$$

1. **Preprocessing (`preprocessingService.js`)**: Validates MIME types, resolves file buffers, and performs image deskewing/enhancement.
2. **OCR (`ocrService.js`)**: Invokes configured multilingual Indic OCR engine. If no provider is configured, throws clean diagnostic without fabricating characters.
3. **Field Extraction (`extractionService.js`)**: Parses Khasra, Khatauni, owner identities, shares, and boundaries via configured AI provider.
4. **Validation (`validationService.js`)**: Enforces deterministic revenue rules (area non-negativity, ownership share summation, and administrative location match).
5. **Confidence Scoring (`confidenceService.js`)**: Computes field-level and overall document confidence percentages, flagging items for manual verification if below threshold.
6. **Verification (`pipelineService.js` & `landRecordController.js`)**: Persists structured `LandRecord` and routes records requiring manual review to `VERIFICATION_OFFICER`.

---

## 🛡️ Security Implementations

- **Helmet**: Hardens HTTP response headers (`Cross-Origin-Resource-Policy`, `X-Content-Type-Options`, `X-Frame-Options`).
- **CORS**: Enforces origin whitelisting configured via `CLIENT_ORIGINS`.
- **Rate Limiting**: Brute-force protection on authentication (`15 req/15min`), upload endpoints (`50 req/15min`), and general API traffic (`300 req/15min`).
- **Password Protection**: Passwords hashed using `bcryptjs` with salt rounds = 10. `passwordHash` is excluded from all default Mongoose queries (`select: false`).
- **No Stack Trace Leakage**: Stack traces are logged internally but suppressed from API client responses in production mode.
- **Database Hygiene**: No dummy data seeded. Collections remain clean until real records are ingested.
