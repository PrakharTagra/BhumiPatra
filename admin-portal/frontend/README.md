# BhumiPatra Administrator Portal (Frontend)

Production-ready, government-portal-inspired Administrative interface for the **BhumiPatra Land Records Modernization & Digitization Platform**.

Built exclusively for the **ADMIN** role to monitor document digitization pipelines, oversee verification queues, manage platform users, and audit operational activity without ever tampering with verified land ownership titles.

---

## 🏛️ Architectural Principles

1. **Strictly Real API-Driven (Zero Dummy Data)**
   - No hardcoded metrics, fake charts, mock users, or synthetic audit entries.
   - All components display live data returned by the backend.
   - When the database or pipeline is empty, clean accessible empty states are rendered (e.g. `Insufficient data for this visualization.`).

2. **Exclusive Administrator Access (RBAC)**
   - Access to this portal is restricted to accounts authenticated with the `ADMIN` role.
   - Protected routing ensures non-admin accounts or unauthenticated sessions are blocked.

3. **Land Record Immutability Safeguard**
   - Administrators monitor end-to-end ingestion status, confidence metrics, and verification outcomes.
   - Administrators **cannot** directly edit verified land attributes or parcel extents from this interface, preserving legal auditability.

4. **Security & Sensitive Data Privacy**
   - User management never exposes raw passwords or password hashes.
   - JWT tokens are automatically attached via an Axios request interceptor and safely purged on 401 expiration.

---

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite 5)
- **Styling**: Tailwind CSS (Government portal-inspired deep navy `#0f243c`, neutral light background `#f8fafc`, subtle borders, clear tabular design)
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Centralized Axios with automatic interceptors
- **Icons**: Lucide React
- **Data Visualizations**: Recharts
- **Language**: JavaScript / JSX

---

## 📂 Project Structure

```
admin-portal/frontend/
├── public/
│   └── logo.svg                 # Clean placeholder BhumiPatra logo
├── src/
│   ├── api/
│   │   ├── axiosClient.js       # Centralized Axios with JWT, 401/403/422/500 handlers
│   │   ├── authApi.js           # /api/auth/login and /api/auth/me
│   │   └── adminApi.js          # /api/admin/* endpoints
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badge.jsx        # Role and pipeline status tags
│   │   │   ├── Button.jsx       # Button with variants and loading spinner
│   │   │   ├── Card.jsx         # Surface container with header & actions
│   │   │   ├── EmptyState.jsx   # Zero-data and insufficient-data handler
│   │   │   ├── ErrorAlert.jsx   # Error banner with retry mechanism
│   │   │   ├── Input.jsx        # Form input with validation states
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Logo.jsx         # Stylized BhumiPatra emblem & typography
│   │   │   ├── Modal.jsx        # Accessible dialog window
│   │   │   ├── Pagination.jsx   # Standard pagination control
│   │   │   ├── Select.jsx       # Styled dropdown selector
│   │   │   ├── Skeleton.jsx     # Table and chart shimmer placeholders
│   │   │   ├── StatCard.jsx     # Telemetry metric card
│   │   │   └── Table.jsx        # Responsive data table
│   │   └── layout/
│   │       ├── AdminLayout.jsx  # Main container (Sidebar + Navbar + Content)
│   │       ├── Navbar.jsx       # Header with breadcrumbs & admin profile menu
│   │       ├── ProtectedRoute.jsx # RBAC route guard enforcing ADMIN role
│   │       └── Sidebar.jsx      # Portal navigation drawer
│   ├── context/
│   │   ├── AuthContext.jsx      # JWT state, /api/auth/me validation, login/logout
│   │   └── ToastContext.jsx     # Toast feedback system (success, error, warning)
│   ├── pages/
│   │   ├── Login.jsx            # Administrator login page
│   │   ├── Dashboard.jsx        # Primary pipeline telemetry & statistics
│   │   ├── Documents.jsx        # Document queue monitoring & read-only inspector
│   │   ├── DigitizationAnalytics.jsx # Throughput & error classification charts
│   │   ├── VerificationAnalytics.jsx # Officer verification & rejection charts
│   │   ├── Users.jsx            # User provision, activation/deactivation
│   │   ├── AuditLogs.jsx        # Tamper-evident operational audit trail
│   │   ├── SystemActivity.jsx   # Infrastructure health & event stream
│   │   ├── Profile.jsx          # Admin profile & security credentials
│   │   └── NotFound.jsx         # 404 handler
│   ├── App.jsx                  # Application routing definitions
│   ├── index.css                # Tailwind directives and portal styling
│   └── main.jsx                 # React root
├── .env                         # Environment variables (VITE_API_BASE_URL)
├── .env.example                 # Environment configuration template
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or higher recommended, tested on Node v20)
- npm (v9 or higher)

### 2. Installation
Navigate to `/admin-portal/frontend`:
```bash
cd admin-portal/frontend
npm install
```

### 3. Environment Configuration
Create or inspect `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```
This specifies the base URL of your shared Node.js/Express backend.

### 4. Running the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 5. Production Build
To create an optimized production build:
```bash
npm run build
```
Preview the built bundle:
```bash
npm run preview
```

---

## 📡 Backend API Contract

The frontend connects to the following REST API endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate administrator with `{ email, password }` |
| `GET` | `/api/auth/me` | Retrieve profile and RBAC role of authenticated admin |
| `GET` | `/api/admin/dashboard` | Real-time counts (total, processed, pending, verified, rejected, failed, accuracy) |
| `GET` | `/api/admin/analytics` | Time-series, status distributions, district progress, error categories |
| `GET` | `/api/admin/users` | List users with pagination and search/role/status filters |
| `POST` | `/api/admin/users` | Create user (`DIGITIZATION_OPERATOR`, `VERIFICATION_OFFICER`, `ADMIN`) |
| `PATCH` | `/api/admin/users/:id/status` | Activate or deactivate user (`{ status: 'ACTIVE' \| 'INACTIVE' }`) |
| `GET` | `/api/admin/documents` | List ingested land documents with pagination and status/district filters |
| `GET` | `/api/admin/documents/:id` | Read-only details of a specific document parcel |
| `GET` | `/api/admin/audit-logs` | Filterable operational audit events (User, Action, Entity, Timestamp) |
| `GET` | `/api/admin/system-activity` | Pipeline daemon events, microservice health, and queue metrics |

### HTTP Status Code Handling
- **401 Unauthorized**: Session expired or invalid token; local token is cleared and user is redirected to `/login?expired=1`.
- **403 Forbidden**: Account lacks `ADMIN` privileges; user is presented with an access denial screen.
- **404 Not Found**: Clear empty state or resource not found notification.
- **422 Unprocessable Entity**: Form validation errors highlighted below respective input fields.
- **500 / 502 / 503 Internal Server Error**: Toast alert and accessible error card with an immediate retry button.
