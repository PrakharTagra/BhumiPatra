# BhumiPatra - Land Record Digitization Portal (Frontend)

Production-ready frontend for **BhumiPatra**, an AI-powered Intelligent Land Record Digitization & Validation System. Designed specifically for the **DIGITIZATION_OPERATOR** role to ingest scanned legacy land records and monitor autonomous AI preprocessing, OCR, entity extraction, mathematical validation, and confidence scoring.

---

## 🏛️ System Architecture & Highlights

- **Operator Role Exclusivity**: Enforces `DIGITIZATION_OPERATOR` role-based access control.
- **Strict SOP Compliance**: Operators collect only 6 administrative indexing attributes. Land parcel entities and owner records are extracted autonomously by AI models with zero manual data entry.
- **Real-Time AI Pipeline Tracking**: Live status monitor tracking the 7 stages without artificial delays:
  $$\text{Upload} \longrightarrow \text{Preprocessing} \longrightarrow \text{OCR} \longrightarrow \text{Extraction} \longrightarrow \text{Validation} \longrightarrow \text{Confidence Analysis} \longrightarrow \text{Completed}$$
- **Zero Dummy Data**: Strictly API-driven. Meaningful empty states, loading skeletons, and connection banners are rendered when backend records are empty or offline.
- **Government-Portal-Inspired Aesthetic**: High-contrast, clean typography, compact data tables, deep navy palette (`#142742`), accessible outlines, and a distinct custom **BhumiPatra** vector brand identity.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Routing**: [React Router 6](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: Modern ECMAScript / JSX

---

## 📁 Directory Structure

```
digitization-portal/frontend/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── .env
├── .env.example
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   ├── client.js          # Centralized Axios client (JWT interceptor, error normalizer)
    │   ├── auth.js            # Login, getMe, logout API methods
    │   └── documents.js       # Upload, list, details, status, and process trigger methods
    ├── context/
    │   ├── AuthContext.jsx    # Authentication & operator session state
    │   └── ToastContext.jsx   # Accessible toast notification system
    ├── components/
    │   ├── common/            # Reusable UI components
    │   │   ├── BhumiPatraLogo.jsx
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Select.jsx
    │   │   ├── Badge.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── ConfidenceBadge.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   ├── TableSkeleton.jsx
    │   │   ├── Pagination.jsx
    │   │   ├── Breadcrumbs.jsx
    │   │   ├── Modal.jsx
    │   │   └── AlertBanner.jsx
    │   ├── layout/            # Layout shells
    │   │   ├── Header.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── MainLayout.jsx
    │   └── documents/         # Domain-specific components
    │       ├── PipelineTracker.jsx  # 7-stage AI pipeline visualizer
    │       └── UploadDropzone.jsx   # Drag-and-drop file uploader (PDF, JPG, PNG, TIFF)
    ├── pages/
    │   ├── LoginPage.jsx              # Operator authentication
    │   ├── DashboardPage.jsx          # Metrics & recent uploads
    │   ├── UploadPage.jsx             # Scanned file & administrative index form
    │   ├── ProcessingDetailsPage.jsx  # Real-time pipeline monitor with polling
    │   ├── DocumentsHistoryPage.jsx   # Searchable, filterable, paginated history table
    │   ├── DocumentDetailPage.jsx     # Read-only extracted parcels & metadata inspection
    │   ├── ProfilePage.jsx            # Operator identity & SOP compliance
    │   └── NotFoundPage.jsx           # 404 handler
    ├── routes/
    │   ├── ProtectedRoute.jsx         # Guard enforcing operator authorization
    │   └── AppRoutes.jsx              # Application route tree
    └── utils/
        ├── constants.js       # Document types, Indian states, pipeline stages, status enums
        └── formatters.js      # Date-time, filesize, and confidence score formatters
```

---

## ⚙️ Environment Variables

Create a `.env` file in `/digitization-portal/frontend/` (a template is provided in `.env.example`):

```bash
# Base URL for the Node.js / Express REST API backend
VITE_API_BASE_URL=http://localhost:5000
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the backend REST API | `http://localhost:5000` |

---

## 🚀 Installation & Running

### 1. Install Dependencies

```bash
cd digitization-portal/frontend
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

The portal will be available at: `http://localhost:5173`

### 3. Production Build

```bash
npm run build
```

The compiled and optimized bundle will be placed in the `dist/` directory.

### 4. Preview Production Build

```bash
npm run preview
```

---

## 🔌 API Contract Reference

The frontend connects to the following REST API endpoints via a centralized Axios instance with automatic JWT Bearer token injection:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate operator with credentials `{ email, password }` |
| `GET` | `/api/auth/me` | Retrieve active operator profile and role |
| `POST` | `/api/documents/upload` | Upload scanned land record (`multipart/form-data`) with administrative index |
| `GET` | `/api/documents` | Fetch paginated, filtered land records list |
| `GET` | `/api/documents/:id` | Retrieve complete document record, metadata, and extracted entities |
| `POST` | `/api/documents/:id/process` | Trigger or re-run the autonomous AI processing pipeline |
| `GET` | `/api/documents/:id/status` | Retrieve live pipeline stage, step details, and diagnostics |

### Error Code Handling:
- **`401 Unauthorized`**: Automatically clears session storage and routes operator to `/login` with an expiration prompt.
- **`403 Forbidden`**: Displays an access-denied state if the account does not possess the `DIGITIZATION_OPERATOR` role.
- **`404 Not Found`**: Renders clear missing document or route diagnostics.
- **`422 Unprocessable Entity`**: Surfaces inline field-level validation errors.
- **`500 Internal Server Error`**: Displays actionable server error banners with retry options.
- **Network / Offline**: Displays a non-blocking connection warning banner with direct "Retry Connection" triggers.

---

## 📄 Operator SOP Compliance Rules

1. **Allowed File Formats**: PDF, JPG, JPEG, PNG, TIFF (up to 50MB per document).
2. **Metadata Only**: Operator collects only:
   - Document Type *(Jamabandi, Khasra, Khatauni, Mutation, Cadastral Map, etc.)*
   - State / UT
   - District
   - Tehsil / Taluk
   - Village / Mauza
   - Record Year
3. **No Manual Transcriptions**: Operators do not type land parcel numbers, areas, or owner names. All land extraction is performed autonomously by the AI OCR & Entity Extraction pipeline.
