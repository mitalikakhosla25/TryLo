
# TryLo — Beta Testing Marketplace

> **V1 Quality Assurance & Production Readiness Architecture Guide**  
> A high-assurance, production-minded beta testing marketplace connecting early-stage startups with passionate, verified beta testers.

---

## 1. Architecture Overview

TryLo uses a **modular monolith** architecture designed for security, isolation, and reliable execution:

- **Frontend:** React 19 + TypeScript + Vite 8 + Tailwind CSS + React Router 7 + TanStack Query 5 (with dynamic route-level code splitting)
- **Backend:** Python 3.13 + FastAPI + Pydantic v2 + SQLAlchemy 2.x + Psycopg 3 + Argon2id (`pwdlib`) + PyJWT + Alembic
- **Database:** Supabase-hosted PostgreSQL with row-level transaction locking (`with_for_update`), foreign key cascades, and check constraints
- **Session Security:** `HttpOnly`, `SameSite=lax` cookie-based JWT sessions with double-submit CSRF protection and per-IP/email brute-force rate limiting

```text
TryLo/
├── frontend/                     # React 19 + Vite 8 + TypeScript application
│   ├── src/
│   │   ├── api/                  # Typed API clients (auth, profile, startups, campaigns, applications, tasks, feedback)
│   │   ├── components/           # UI components (Header, ProtectedRoute, WorkspaceGuard, ConnectionStatus)
│   │   ├── context/              # AuthContext, TanStack Query hooks
│   │   ├── pages/                # Route-level lazy-loaded views
│   │   ├── App.tsx               # Code-split router & Suspense fallbacks
│   │   └── index.css             # Tailwind design system tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── backend/                      # FastAPI application
│   ├── app/
│   │   ├── api/                  # Modular route controllers (health, auth, profiles, startups, campaigns, applications, tasks, feedback)
│   │   ├── core/                 # Pydantic Settings, Argon2id security, JWT, rate limiting, slug generation
│   │   ├── db/                   # Database session, psycopg 3 engine, and connection health diagnostics
│   │   ├── models/               # SQLAlchemy 2.x declarative models (User, Profiles, Startup, Campaign, Applications, Progress, Feedback)
│   │   └── schemas/              # Pydantic v2 request/response validation schemas
│   ├── alembic/                  # Additive migration chain (Head: 2823c68f60b5)
│   ├── tests/                    # 175 automated integration & unit tests (pytest)
│   ├── alembic.ini               # Alembic configuration
│   ├── requirements.txt          # Python backend dependencies
│   └── .env.example              # Environment variable template
├── .gitignore                    # Git exclusions for secrets, caches, and node_modules
└── README.md                     # This complete documentation
```

---

## 2. Implemented Feature Matrix

| Domain | Implemented Capabilities | Security & Integrity Controls |
|---|---|---|
| **Authentication & Sessions** | Self-registration (`founder`, `tester`), login, logout, session persistence (`/api/auth/me`). | Passwords hashed with Argon2id; session stored in `HttpOnly` cookie; CSRF double-submit token cookie; rate limiting on failed logins. |
| **User Profiles & Onboarding** | Founder startup details & company stage; Tester skills, devices, and experience level; `WorkspaceGuard` redirection. | Role verification (`require_role`); immutable user ID mapping; sanitization against XSS. |
| **Startup Management** | Multi-startup creation, slug generation, editing, listing. | Ownership verification (`Startup.owner_id == current_user.id`); cross-tenant access returns HTTP 404. |
| **Campaign Management** | Draft creation, step wizard, structured testing tasks, target audience criteria, screening questions, publishing, closing, draft deletion. | Atomic draft validation; lifecycle transitions; private access instructions strictly withheld from public discovery. |
| **Tester Discovery & Apply** | Public campaign browsing, keyword search, filtering by category, reward type, devices, and deadline. Application submission with custom screening answers. | Unauthenticated visitors can view public details; application answers validated by question type; duplicate application prevention. |
| **Application Review & Capacity** | Founder applicant dashboard, screening answer inspection, acceptance, rejection with optional internal note. | Atomic row locking (`with_for_update`) on `Campaign` enforces `max_testers` capacity under concurrent requests. |
| **Task Execution & Progress** | Accepted tester task checklist, step-by-step progress updating (`not_started`, `in_progress`, `completed`), private access instruction release. | Access instructions released **only** to accepted testers (`status == 'accepted'`); progress updates isolated per tester. |
| **Feedback & Bug Reporting** | Bug reports with severity, reproduction steps, expected/actual behavior, associated task tagging. | Submissions linked to verified campaign membership; non-accepted testers cannot submit feedback. |
| **Founder Issue Management** | Feedback review dashboard, filtering/search, private internal notes, audit history timeline, retest request loop, issue resolution, reopen. | Validated state machine (`ALLOWED_TRANSITIONS`); internal notes and history strictly isolated from testers; cross-founder 404 protection. |
| **AI Feedback Analysis** | Explicitly marked **"Coming Soon" (V2)** in UI. No external AI API calls or fabricated insights. | Zero external AI dependencies; TryLo operates 100% human-verified and founder-driven for V1. |

---

## 3. Database Schema & Migration History

The database schema is managed through linear Alembic revisions against Supabase PostgreSQL:

```text
27b1729e8896 (create users table)
  └── b3aeb2a343c7 (create founder and tester profiles)
        └── fb4e67155e31 (create startups table)
              └── b66ba9e0dd6c (create campaigns table)
                    └── e82f93ab4d1c (create campaign applications table)
                          └── c911855b4a2e (add rejection note to applications)
                                └── d4a8e91f0c2b (create task progress and feedback submissions)
                                      └── 2823c68f60b5 (add internal notes, status history, and retest fields) [HEAD]
```

### Database Operations
```powershell
cd backend

# Verify current database revision against migrations
.\.venv\Scripts\alembic current

# Check for schema drift between ORM models and live database
.\.venv\Scripts\alembic check

# Apply pending migrations
.\.venv\Scripts\alembic upgrade head
```

---

## 4. Local Development Quickstart

### Prerequisites
- **Python 3.11+** (Python 3.13 tested)
- **Node.js 20+** (Node v22 tested)
- **Supabase PostgreSQL** instance (Direct connection or Session pooler)

### Step 1: Backend Setup
```powershell
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
Copy-Item .env.example .env
# Edit .env and supply your Supabase connection string:
# DATABASE_URL=postgresql+psycopg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require

# Run database migrations
alembic upgrade head

# Run automated tests (175 tests)
pytest -v

# Start FastAPI backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Step 2: Frontend Setup
```powershell
cd frontend

# Install dependencies
npm install

# Verify linting
npm run lint

# Build verification (production code-splitting check)
npm run build

# Start Vite dev server
npm run dev
```

The web application is live at `http://localhost:5173`.  
FastAPI Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

## 5. Security Architecture & Boundary Verification

1. **Role-Based Access Control (RBAC):**
   - Protected API endpoints employ `require_role(["founder"])` or `require_role(["tester"])`.
   - Anonymous requests receive HTTP `401 Unauthorized`.
   - Unauthorized roles receive HTTP `403 Forbidden`.
2. **Founder Ownership Boundaries:**
   - Database queries join through `Startup.owner_id == current_user.id`.
   - Accessing campaigns, applications, or feedback belonging to other founders returns HTTP `404 Not Found` (preventing tenant enumeration).
3. **Tester Privacy & Isolation:**
   - Testers only access applications and task progress where `tester_id == current_user.id`.
   - Confidential product access instructions are stripped from all public endpoints and released **only** when `CampaignApplication.status == 'accepted'`.
   - Founder internal notes (`feedback_internal_notes`) and audit status history are filtered out of all tester responses.
4. **Injection & Scripting Prevention:**
   - 100% parameter-bound queries via SQLAlchemy 2.0 type-safe expressions (zero raw SQL string concatenation).
   - Zero `dangerouslySetInnerHTML` usage in frontend; all user inputs are React JSX escaped.
   - Pydantic v2 input sanitization and character length constraints on all input models.
5. **CSRF & Cookie Protection:**
   - Access tokens stored in `HttpOnly`, `SameSite=lax` cookies.
   - In production (`APP_ENV=production`), `COOKIE_SECURE=true` ensures HTTPS-only transport.
   - State-changing logout actions require matching double-submit `X-CSRF-Token` headers.

---

## 6. Production Deployment Readiness

### Required Environment Variables

#### Backend (`backend/.env`)
| Variable | Production Requirement | Example / Notes |
|---|---|---|
| `APP_ENV` | Must be `production` | Enables strict secret checks and HTTPS cookies. |
| `DATABASE_URL` | Supabase Pooler URI | `postgresql+psycopg://postgres.[ref]:[pw]@aws-0-[reg].pooler.supabase.com:5432/postgres?sslmode=require` |
| `JWT_SECRET_KEY` | At least 32 cryptographically random bytes | Generate via: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `CORS_ORIGINS` | Comma-separated production domains | `https://trylo.com,https://app.trylo.com` |
| `COOKIE_SECURE` | Set to `true` | Ensures cookies are transmitted exclusively over HTTPS. |
| `COOKIE_DOMAIN` | Production domain or subdomains | `.trylo.com` (or empty for current origin) |
| `LOGIN_RATE_LIMIT_MAX_ATTEMPTS` | Brute force threshold | Default: `5` attempts per 300 seconds. |

#### Frontend (`frontend/.env`)
| Variable | Production Requirement | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | Public API domain | e.g. `https://api.trylo.com` (leave empty if served behind same-domain reverse proxy) |

### Production Build Commands
```powershell
# Frontend production bundle
cd frontend
cmd /c npm run build

# Backend production server
cd backend
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 7. Automated Test Suite Results

- **Backend Pytest Suite:** **175 passed** in 37.73s
  - 100% pass rate across:
    - 4 live Supabase PostgreSQL database integration tests (`test_db_integration.py`)
    - 17 founder feedback and review tests (`test_founder_feedback.py`)
    - 21 tester tasks and progress execution tests (`test_tester_tasks_and_feedback.py`)
    - 19 founder application review tests (`test_founder_applications.py`)
    - 16 campaign lifecycle tests (`test_campaigns.py`)
    - 12 public discovery tests (`test_campaign_discovery.py`)
    - 25 authentication and session tests (`test_auth.py`, `test_session_and_roles.py`, `test_security.py`)
    - 18 startup management tests (`test_startups.py`)
    - 11 profile onboarding tests (`test_profiles.py`)
- **Frontend Quality:**
  - `oxlint`: **0 errors, 0 warnings** across 52 files and 116 rules.
  - Production build: **Zero oversized chunks**; initial bundle footprint reduced by 65% via dynamic code-splitting.

# TryLo
A startup beta-testing marketplace connecting founders with real users for structured product feedback.

a27548b5e79840b93149e6bfb054fc0adbf841ba
