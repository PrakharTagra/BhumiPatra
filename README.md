# BhumiPatra (भूमिपत्र)
### Land Record Digitization & Verification System

BhumiPatra is an enterprise-grade platform for digitizing, extracting, validating, and managing legacy Indian land records (Khatauni, Khasra, Jamabandi, Mutation registers, and Sale Deeds).

The system integrates five production components into a single, cohesive architecture:
1. **Document Analysis Engine** (`/document-analysis-engine`) — Python 3.11+, FastAPI, OpenCV, PaddleOCR, PyMuPDF (Port 8000).
2. **Central Backend API** (`/backend`) — Node.js, Express, MongoDB, Mongoose, JWT, Multer (Port 5000).
3. **Digitization Portal** (`/digitization-portal/frontend`) — For **Digitization Operators** (Port 5173).
4. **Verification Portal** (`/verification-portal/frontend`) — For **Verification Officers / Tehsildars** (Port 3001).
5. **Administrator Portal** (`/admin-portal/frontend`) — For **System Administrators** (Port 3000).

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Frontends ["Unified Multi-Portal User Interfaces"]
        DP["Digitization Portal (Port 5173)<br/>Role: DIGITIZATION_OPERATOR<br/>• Scanned Document Upload<br/>• 7-Stage Pipeline Monitoring<br/>• Operator Dashboard"]
        VP["Verification Portal (Port 3001)<br/>Role: VERIFICATION_OFFICER<br/>• Two-Panel Workstation<br/>• PDF / Scan Inspection<br/>• Field Corrections & Approval"]
        AP["Administrator Portal (Port 3000)<br/>Role: ADMIN<br/>• User Management & RBAC<br/>• Deep Analytics & Health<br/>• Tamper-Evident Audit Logs"]
    end

    subgraph CentralBackend ["BhumiPatra Central Backend API (Port 5000)"]
        AUTH["Auth & RBAC Service<br/>(JWT, Bcrypt, 3 Roles)"]
        DOCS["Document Vault & Storage<br/>(Multer, Static Vault)"]
        PIPE["Pipeline Dispatcher & Orchestrator<br/>(Manages Status, State & History)"]
        VERIF["Verification Engine<br/>(Field Corrections & Approvals)"]
        AUDIT["Immutable Audit Logger<br/>(Action, User, IP, Timestamp)"]
    end

    subgraph AnalysisEngine ["Document Analysis Engine (Port 8000)"]
        PDF["PyMuPDF Document Ingestion<br/>(Multi-page PDF & Image Normalization)"]
        PRE["OpenCV Preprocessing<br/>(Deskew, CLAHE, Bilateral Filter)"]
        OCR["PaddleOCR Engine<br/>(Hindi & English Multi-lingual Token Detection)"]
        EXT["Cadastral Extraction & Regex<br/>(Khasra, Khata, Area, Owners, Classification)"]
        VAL["Deterministic Rules & Confidence Engine<br/>(Bounding Boxes, Cross-Validation, Scoring)"]
        PDF --> PRE --> OCR --> EXT --> VAL
    end

    subgraph Database ["Single MongoDB Database ('bhumipatra')"]
        C1[("users")]
        C2[("documents")]
        C3[("land_records")]
        C4[("processing_logs")]
        C5[("verification_logs")]
        C6[("audit_logs")]
    end

    DP -->|REST API / JWT| CentralBackend
    VP -->|REST API / JWT| CentralBackend
    AP -->|REST API / JWT| CentralBackend

    CentralBackend -->|HTTP / Multipart Form / API Key| AnalysisEngine
    AnalysisEngine -->|JSON Bounding Boxes & Confidence| CentralBackend

    CentralBackend --> C1
    CentralBackend --> C2
    CentralBackend --> C3
    CentralBackend --> C4
    CentralBackend --> C5
    CentralBackend --> C6
```

---

## ⚡ Port & Service Mapping

| Component | Directory | Port | Default URL | Primary Role |
| :--- | :--- | :--- | :--- | :--- |
| **Document Analysis Engine** | `/document-analysis-engine` | `8000` | `http://localhost:8000` | Computer Vision & AI OCR Engine |
| **Backend API** | `/backend` | `5000` | `http://localhost:5000` | Central Orchestrator / All Roles |
| **Digitization Portal** | `/digitization-portal/frontend` | `5173` | `http://localhost:5173` | `DIGITIZATION_OPERATOR` |
| **Verification Portal** | `/verification-portal/frontend` | `3001` | `http://localhost:3001` | `VERIFICATION_OFFICER` |
| **Administrator Portal** | `/admin-portal/frontend` | `3000` | `http://localhost:3000` | `ADMIN` |

---

## 🔐 Zero Dummy Data & Initial System Bootstrap

BhumiPatra follows a strict **Zero Dummy Data** policy:
- No hardcoded users, records, or artificial statistics are seeded.
- Dashboards and queues show pristine empty states when no records exist.
- To initialize the first system administrator without manual MongoDB intervention, use either:

### Option A: Command-Line Bootstrap (Recommended)
```bash
npm run setup-admin
```
This initializes:
- **Email**: `admin@bhumipatra.gov.in`
- **Password**: `BhumiPatra@Admin2026`
- **Role**: `ADMIN`

### Option B: REST API One-Time Setup Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Administrator",
    "email": "admin@bhumipatra.gov.in",
    "password": "BhumiPatra@Admin2026",
    "department": "Land Records & Revenue Department"
  }'
```
> **Security Note**: This endpoint only operates when `User.countDocuments() === 0`. Once an administrator exists, all subsequent requests return `403 Forbidden`.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+ recommended)
- Python 3.11+
- MongoDB running locally at `mongodb://localhost:27017`

### 2. Install Dependencies
```bash
# Install Python Document Analysis Engine dependencies
cd document-analysis-engine && pip install -r requirements.txt && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd admin-portal/frontend && npm install && cd ../..
cd verification-portal/frontend && npm install && cd ../..
cd digitization-portal/frontend && npm install && cd ../..
```

### 3. Bootstrap Initial Administrator
```bash
npm run setup-admin
```

### 4. Start Development Servers
Run each in a separate terminal:

```bash
# Terminal 1: Document Analysis Engine (Port 8000)
npm run dev:engine
# (or cd document-analysis-engine && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload)

# Terminal 2: Backend API (Port 5000)
npm run dev:backend

# Terminal 3: Administrator Portal (Port 3000)
npm run dev:admin

# Terminal 4: Verification Officer Portal (Port 3001)
npm run dev:verification

# Terminal 5: Digitization Operator Portal (Port 5173)
npm run dev:digitization
```

### 5. Automated Test Suites
Run all automated test suites across engine and microservices:

```bash
# 1. Python Document Analysis Engine Unit & API Tests (13 test suites)
npm run test:engine

# 2. Comprehensive 15-Stage Integration Workflow Test
npm run test:integration
```

---

## 🔄 End-to-End Workflow Verification

A complete automated end-to-end integration test is provided in `backend/src/scripts/testWorkflow.js`:

```bash
npm run test:integration
```

This automated test executes and validates the entire operational lifecycle:
1. **Health Check**: Validates `/api/health` status.
2. **Setup Guard**: Verifies `POST /api/auth/setup` denies duplicate admin creation (403).
3. **Admin Authentication**: Logs in as `ADMIN` and fetches live database metrics.
4. **User Creation**: Admin creates `DIGITIZATION_OPERATOR` and `VERIFICATION_OFFICER` accounts.
5. **RBAC Verification**: Confirms Operator cannot access Admin dashboard (403) and Officer cannot create users (403).
6. **Document Upload**: Operator uploads a scanned PDF/image via multipart form data (`POST /api/documents/upload`).
7. **Processing Pipeline Execution**: 7-stage processing executes (`Upload → Preprocessing → Ingestion → Extraction → Validation → Scoring → Completed`).
8. **Officer Workstation**: Officer pulls pending queue (`GET /api/land-records/pending`), inspects the two-panel view, makes an in-line field correction with justification (`PUT /api/land-records/:id`), and approves the record (`POST /api/land-records/:id/approve`).
9. **Audit Trail**: Verifies that user logins, document uploads, processing runs, corrections, and approvals are stored in `audit_logs` and `verification_logs`.

---

## 📊 Document Processing Pipeline

When an operator uploads a legacy land record, the document transitions through distinct processing stages:

1. **UPLOAD** — File validated, assigned unique ID (`DOC-YYYYMMDD-XXXXXXXX`), securely stored in `/uploads/documents`.
2. **PREPROCESSING** — Image normalization, contrast enhancement, rotation correction.
3. **TEXT INGESTION** — Text recognition extracts textual content in Hindi/English.
4. **EXTRACTION** — Structured entity extraction (Khasra No, Khatauni No, Khewat No, Area, Land Classification, Tenure Holders/Owners, Share Ratios).
5. **VALIDATION** — Rule-based checks (required fields, format standards, mathematical consistency of area and shares).
6. **CONFIDENCE ANALYSIS** — Field-level and composite confidence scoring (0-100%). High confidence (≥80%) and Low confidence (<80%) classification.
7. **COMPLETED** — Creates a corresponding `LandRecord` in `NEEDS_VERIFICATION` / `PENDING` state and notifies the verification queue.

---

## 📑 Verification Workstation (Port 3001)

Designed specifically for **Tehsildars** and **Revenue Officers**:
- **Split-Screen Interface**: Left panel displays original scanned document (zoom, pan, rotate); Right panel displays extracted fields with confidence scores.
- **In-Line Field Correction**: Officer can edit any extracted value. Every modification requires a stated reason and is recorded in `verification_logs`.
- **Three Core Decisions**:
  - **Approve**: Marks record as `VERIFIED` with official remarks.
  - **Reject**: Marks record as `REJECTED` with specific rejection reason.
  - **Send Back**: Returns document to `DIGITIZATION_OPERATOR` for rescanning or correction.

---

## 🛡️ Security & Governance

- **JSON Web Tokens (JWT)**: Cryptographically signed tokens with configurable expiration (`JWT_EXPIRES_IN=7d`).
- **Role-Based Access Control (RBAC)**: Centralized middleware guards enforce strict separation of duties.
- **Rate Limiting**: Configured across auth, document upload, and general API endpoints.
- **CORS Protection**: Whitelists only the three authorized portal origins.
- **Helmet Security Headers**: Protection against XSS, clickjacking, and mime-sniffing.
- **Audit Logging**: Every sensitive action (login, logout, upload, pipeline trigger, field edit, approval) creates an immutable record in `audit_logs`.

---

## 🔍 Document Analysis Engine Contract & Bounding Boxes

The Python Document Analysis Engine exposes `POST /analyze` accepting multipart form-data. It returns token-level coordinates and field-level evidence bounding boxes for the Verification Workstation:

```json
{
  "success": true,
  "document": { "pageCount": 1, "languages": ["hi", "en"], "mimeType": "image/png" },
  "ocr": {
    "totalPages": 1,
    "pages": [
      {
        "pageNumber": 1,
        "width": 800,
        "height": 400,
        "tokens": [
          { "text": "Khasra Number: 142/2", "bbox": [45, 50, 425, 94], "confidence": 0.997 }
        ]
      }
    ]
  },
  "extractedFields": {
    "khasra_number": {
      "value": "142/2",
      "confidence": 0.98,
      "requiresVerification": false,
      "bbox": [45, 50, 425, 94],
      "page": 1,
      "evidence": "Khasra Number: 142/2"
    }
  },
  "validation": { "status": "PASSED", "score": 100.0, "issues": [] },
  "confidence": { "overallConfidence": 87.0, "requiresHumanVerification": true }
}
```

In the **Verification Portal Workstation**, when an officer hovers or focuses on any extracted field (e.g. `khasra_number`), the UI highlights the corresponding `bbox: [x1, y1, x2, y2]` on the original document canvas in real time.

