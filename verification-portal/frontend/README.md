# BhumiPatra Land Record Verification Portal (Frontend)

Production-ready, government-portal-inspired verification workstation for the **BhumiPatra Land Records Modernization & Digitization Platform**.

Built exclusively for the **VERIFICATION_OFFICER** role to audit AI-extracted land titles, adjust uncertain attributes with mandatory justification, inspect high-resolution deed scans, and record statutory approval/rejection decisions.

---

## 🏛️ Architectural Principles

1. **Strictly Real API-Driven (Zero Dummy Data)**
   - No mock numbers, synthetic confidence scores, or fake land titles.
   - When no records exist in the queue or repository, clean accessible empty states are rendered.

2. **Primary Two-Panel Verification Workstation (`/verify/:id`)**
   - **LEFT PANEL**: Original scanned instrument viewer with PDF & Image support, dynamic zoom (50% to 250%), pan/drag manipulation, 90° rotation, and multi-page navigation.
   - **RIGHT PANEL**: AI-extracted land attributes (Owner Name, Khasra, Khata, Survey, Area, Area Unit, Village, Tehsil, District, Classification, Ownership, Mutation, Registration).
   - **Confidence Pill**: Every field displays its AI confidence score (e.g. `Area: 2.45 hectare — 61% confidence`), automatically highlighting low-confidence items (< 75%) for officer review.
   - **Audited Field Corrections**: Officers can correct any attribute. The frontend never directly modifies MongoDB; every correction with previous value, new value, and mandatory justification is submitted to `PUT /api/land-records/:id`.

3. **5-Rule Automated Validation Panel**
   - Evaluates:
     - **Required Field Validation**: Ensures statutory ownership & parcel identifiers are non-empty.
     - **Format Validation**: Validates numerical areas and cadastral format standards.
     - **Duplicate Detection**: Identifies conflicting parcel claims in the village ledger.
     - **Cross-Field Validation**: Verifies consistency between area units, jurisdiction, and deed types.
     - **Database Verification**: Validates records against master registry ledgers.
   - Visualized with standardized **`PASS`**, **`WARNING`**, and **`FAILED`** badges.

4. **Statutory Decision Actions**
   - **Approve Record**: Displays confirmation modal requiring officer sign-off (`POST /api/land-records/:id/approve`).
   - **Reject Record**: Mandates official reason for rejection (`POST /api/land-records/:id/reject`).
   - **Send Back**: Mandates operator rescan or optical re-processing instructions (`POST /api/land-records/:id/send-back`).
   - **Audit History**: Modal displaying chronological adjustments (Field, Previous Value, New Value, Officer, Reason, Timestamp).

5. **Exclusive RBAC Security**
   - Restricted exclusively to authenticated users with `role: "VERIFICATION_OFFICER"`.
   - JWT tokens are automatically injected into outgoing requests via a centralized Axios client.

---

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite 5)
- **Styling**: Tailwind CSS (Navy palette `#0f243c`, neutral slate backgrounds `#f8fafc`, high-contrast typography, clear data-dense tables, minimal animations)
- **Routing**: React Router DOM (v6) with RBAC route protection
- **HTTP Client**: Centralized Axios with JWT and 401/403/404/422/500 handlers
- **Icons**: Lucide React
- **Brand Compliance**: Pure geometric custom SVG placeholder for the **BhumiPatra logo** without any government emblems, ministry seals, or restricted assets.

---

## 📂 Project Structure

```
verification-portal/frontend/
├── public/
│   └── logo.svg                 # Clean placeholder BhumiPatra logo
├── src/
│   ├── api/
│   │   ├── axiosClient.js       # Centralized Axios with JWT & status handlers
│   │   ├── authApi.js           # /api/auth/login and /api/auth/me
│   │   └── verificationApi.js   # /api/land-records/* endpoints
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badge.jsx        # PASS, WARNING, FAILED & status pills
│   │   │   ├── Button.jsx       # Action buttons with loading states
│   │   │   ├── Card.jsx         # Card container
│   │   │   ├── EmptyState.jsx   # Zero-data handler
│   │   │   ├── ErrorAlert.jsx   # Error banner with retry
│   │   │   ├── Input.jsx        # Text input component
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Logo.jsx         # Stylized BhumiPatra emblem
│   │   │   ├── Modal.jsx        # Accessible dialog window
│   │   │   ├── Pagination.jsx   # Data pagination control
│   │   │   ├── Select.jsx       # Dropdown selector
│   │   │   ├── Skeleton.jsx     # Table and field skeletons
│   │   │   ├── StatCard.jsx     # Real API telemetry card
│   │   │   └── Table.jsx        # Tabular data display
│   │   ├── layout/
│   │   │   ├── OfficerLayout.jsx# Workstation shell
│   │   │   ├── Navbar.jsx       # Header & officer profile menu
│   │   │   ├── ProtectedRoute.jsx # RBAC guard (VERIFICATION_OFFICER only)
│   │   │   └── Sidebar.jsx      # Portal navigation drawer
│   │   └── verification/
│   │       ├── ActionModals.jsx # Approve, Reject, and Send Back modals
│   │       ├── AuditHistoryModal.jsx # Field change audit log
│   │       ├── DocumentViewer.jsx # Pan, zoom, rotate & page navigation
│   │       ├── FieldItem.jsx    # Extracted field with confidence & edit
│   │       └── ValidationPanel.jsx # 5 automated validation rule engines
│   ├── context/
│   │   ├── AuthContext.jsx      # Officer JWT session & validation
│   │   └── ToastContext.jsx     # Feedback toast alerts
│   ├── pages/
│   │   ├── Login.jsx            # Officer sign-in
│   │   ├── Dashboard.jsx        # Overview metrics & recently reviewed
│   │   ├── Queue.jsx            # Verification queue table with filters
│   │   ├── RecordVerification.jsx # Primary two-panel verification workstation
│   │   ├── VerifiedRecords.jsx  # Approved records repository
│   │   ├── RejectedRecords.jsx  # Discrepancy & rejected records repository
│   │   ├── VerificationHistory.jsx # Global audit trail
│   │   ├── Profile.jsx          # Officer credentials & jurisdiction
│   │   └── NotFound.jsx         # 404 handler
│   ├── App.jsx                  # Application routing definitions
│   ├── index.css                # Tailwind directives
│   └── main.jsx                 # React root
├── .env                         # Environment variables (VITE_API_BASE_URL)
├── .env.example                 # Template for environment configuration
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or higher, tested on Node v20)
- npm (v9 or higher)

### 2. Installation
Navigate to `/verification-portal/frontend`:
```bash
cd verification-portal/frontend
npm install
```

### 3. Environment Configuration
Verify or edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3001`.

### 5. Production Build
```bash
npm run build
```

---

## 📡 Backend API Contract

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate officer with `{ email, password }` |
| `GET` | `/api/auth/me` | Fetch authenticated officer profile & jurisdiction |
| `GET` | `/api/land-records/pending` | Fetch pending queue with pagination and filters |
| `GET` | `/api/land-records/:id` | Fetch full details, document scan URL, and extracted fields |
| `PUT` | `/api/land-records/:id` | Submit field correction `{ field, value, previousValue, reason }` |
| `POST` | `/api/land-records/:id/approve` | Approve record `{ remarks }` |
| `POST` | `/api/land-records/:id/reject` | Reject record `{ reason }` |
| `POST` | `/api/land-records/:id/send-back` | Send back record to operator `{ reason }` |
| `GET` | `/api/land-records/:id/verification-history` | Fetch audit trail of field corrections |
