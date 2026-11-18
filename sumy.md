# TryLo Comprehensive System & Feature Architecture Summary (`sumy.md`)

> **Document Version:** 2.0.0  
> **Target Audience:** AI Engineering Agents, LLM Code Assistants, Lead Software Architects, Full-Stack Developers  
> **Repository:** `https://github.com/mitalikakhosla25/TryLo.git`  
> **Active Working Branch:** `Gaurisha-TryLo`  
> **Last Updated:** November 2026  

---

## 1. Executive Summary & System Philosophy

**TryLo** is a next-generation crowdsourced product testing, bug bounty, and QA intelligence platform connecting early-stage tech founders with verified human testers.

Unlike traditional bug trackers or passive user-testing services, TryLo bridges the entire testing lifecycle:
1. **AI Campaign Genesis:** Founders generate entire testing campaigns from a single natural language prompt.
2. **Native Proof Collection:** Testers record their screen, voice, clicks, and browser viewport with zero third-party software.
3. **AI Proof Attestation & Anti-Fraud Sentinel:** Multi-vector AI engines verify tester authenticity, keystroke/mouse entropy, and task compliance before payouts are released.
4. **Instant Escrow Settlement:** Automated escrow vaults disburse instant simulated NPCI UPI payouts, locked with SHA-256 cryptographic attestation receipts.
5. **AI Developer Triage & Remediation:** Bug reports are automatically deduplicated, ranked by Monthly Recurring Revenue (MRR) risk, converted into Playwright/Cypress scripts, and transformed into 1-click unified Git diff patches.

### The Zero-Crash Dual-Engine Philosophy
Every single AI feature in TryLo follows the **Dual-Engine Pattern**:
- **Primary Engine:** Google Gemini 1.5 Flash via REST API (invoked via `app.services.ai_client.generate_text_with_gemini`).
- **Zero-Crash Heuristic Fallback Engine:** Deterministic, domain-specific NLP rule engines that execute immediately if Gemini credentials are not configured, rate-limited, or unavailable.
- **Guarantee:** TryLo **never** crashes, throws an unhandled 500 error, or locks the user out when running without third-party API subscriptions or in air-gapped demo environments.

---

## 2. Technology Stack & Runtime Topology

### Backend Architecture
- **Framework:** FastAPI (Python 3.12+)
- **Database ORM:** SQLAlchemy 2.0 (Mapped Columns, Async-ready patterns)
- **Validation & Schemas:** Pydantic v2
- **Database Engine:** SQLite (local development) / PostgreSQL (production) with custom JSONB-variant adapters
- **Security & Auth:** OAuth2 Password Bearer, JWT Tokens (HS256), passlib (bcrypt)
- **Testing:** Pytest, HTTPX TestClient, 35+ automated AI integration tests running in <1.5s
- **AI Integrations:** Google Gemini 1.5 Flash (`gemini-1.5-flash`), Custom Heuristic Rule Engines, Unified Diff Patch Synthesizers, SHA-256 Cryptographic Hashers

### Frontend Architecture
- **Framework:** React 18 with TypeScript (`strict` mode enabled)
- **Build Tool:** Vite with Rolldown / ESBuild bundling
- **Styling:** Tailwind CSS with custom TryLo design tokens (Teal `#07545A`, `#087C80`, Cream `#FAF9F5`, Slate `#102A35`)
- **State & Server Cache:** TanStack React Query v5 (`@tanstack/react-query`)
- **Icons:** Lucide React (`lucide-react`)
- **Browser APIs:** HTML5 MediaDevices API (`getDisplayMedia`, `getUserMedia`), Web Audio API (`AudioContext`, `AnalyserNode`), Web Animations API, MediaRecorder API (`video/webm;codecs=vp9`)

---

## 3. Comprehensive Feature Catalog & Implementation Deep-Dive

Below is the complete inventory of features implemented across TryLo, detailing their exact purpose, files, data flows, and code patterns.

---

### Feature 1: "Prompt-to-Campaign" AI Campaign Architect
- **User Problem:** Founders often find writing testing instructions, acceptance criteria, target demographics, and screening questions tedious and time-consuming.
- **Solution:** Founders enter a single product description or vision (e.g. *"A B2B SaaS invoice reconciliation tool"*). The AI Campaign Architect instantly generates the campaign title, summary, long-form description, product category, simulated test access credentials, 3-5 structured testing tasks with acceptance criteria, 2 screening questions, target demographics, and recommended rewards.
- **Files Modified/Created:**
  - `backend/app/services/ai_campaign_architect.py`: Core synthesis service with prompt templates and industry-specific heuristic fallback generators (FinTech, DevTools, E-commerce, SaaS).
  - `backend/app/schemas/feedback.py`: `CampaignAiArchitectRequest`, `CampaignAiArchitectResponse`, `CampaignArchitectTaskItem`, `CampaignArchitectScreeningItem`, `CampaignArchitectAudienceItem`.
  - `backend/app/api/campaigns.py`: Endpoint `POST /api/founder/campaigns/ai-architect`.
  - `frontend/src/pages/CampaignWizardPage.tsx`: Integrated AI Architect modal with 1-click wizard auto-fill.
  - `backend/tests/test_ai_campaign_architect.py`: 5 unit tests covering heuristics and Gemini mocks.
- **Data Flow:**
  1. Founder clicks **"✨ Architect with AI"** in Campaign Wizard.
  2. Frontend sends prompt to `POST /api/founder/campaigns/ai-architect`.
  3. Backend checks `GEMINI_API_KEY`. If present, calls Gemini 1.5 Flash; otherwise, executes domain heuristics.
  4. Returns fully structured JSON conforming to `CampaignAiArchitectResponse`.
  5. Frontend auto-populates all 4 steps of the wizard for immediate publishing.

---

### Feature 2: 1-Click Git Diff Patch & Terminal `git apply` Generator
- **User Problem:** When testers submit bug reports, founders and software engineers must manually reconstruct the defect, search their repository, locate the bug file, and write the fix from scratch.
- **Solution:** The AI Bug Triage engine inspects the bug's stack trace, browser console errors, and component name, automatically generating a valid, production-ready unified Unix Git diff patch. Engineers can either click **"Download .patch"** or click **"Copy `git apply`"** to apply the fix directly into their terminal.
- **Files Modified/Created:**
  - `backend/app/services/ai_triage.py`: Enriched `analyze_feedback_item` with `_synthesize_git_diff_patch(title, component, root_cause)`.
  - `backend/app/api/feedback.py`: Added `GET /api/founder/feedback/{id}/download-patch` endpoint streaming unified `.patch` text files as attachments.
  - `frontend/src/components/feedback/AiTriageCard.tsx`: Added syntax-highlighted diff display box (green additions, red removals), 1-click `git apply` clipboard action, and direct patch download button.
  - `frontend/src/api/feedback.ts`: Updated `AiTriageResponse` schema with `git_diff_patch`.
- **Data Flow:**
  1. Founder opens a bug detail page (`/founder/feedback/{id}`).
  2. Triage card loads AI root-cause analysis and generated `git_diff_patch`.
  3. Clicking "Copy `git apply` command" generates:
     ```bash
     curl -s https://api.trylo.io/api/founder/feedback/<id>/download-patch | git apply -v
     ```
  4. Engineer applies the patch locally in seconds.

---

### Feature 3: AI Tester Proof Attestation & Anti-Fraud Sentinel
- **User Problem:** Crowdsourced testing is plagued by low-effort spam, automated scripts, bots, and testers submitting fake bugs to claim rewards.
- **Solution:** An automated Sentinel audits every feedback submission against 4 key vectors:
  1. *Human Keystroke & Mouse Telemetry Signature:* Verifies non-linear cursor entropy and natural cadence.
  2. *Campaign Pass Criteria Adherence:* Evaluates reproduction steps against campaign testing tasks.
  3. *Reproduction Proof Completeness:* Verifies attached video recordings, durations, and timestamps.
  4. *Device Entropy & Browser Environment:* Detects headless browsers (Puppeteer, Selenium) or forged user-agents.
  Outputs an overall Trust Score (0-100), Fraud Risk tier (`low`, `medium`, `high`, `critical_bot`), and payout recommendation (`approve`, `approve_partial`, `hold`, `reject`).
- **Files Modified/Created:**
  - `backend/app/services/ai_proof_sentinel.py`: Full audit service with regex-based heuristics and Gemini 1.5 Flash verification prompt.
  - `backend/app/schemas/feedback.py`: `AiProofAttestationResponse`, `ProofAttestationBadge`.
  - `backend/app/api/feedback.py`: Endpoints `GET` and `POST /api/founder/feedback/{id}/attestation-audit`.
  - `frontend/src/components/feedback/AiProofSentinelCard.tsx`: Renders Trust & Proof Score, Telemetry Entropy Gauge, Task Adherence, and 4 vector badges.
  - `backend/tests/test_ai_proof_sentinel.py`: Tests for high-quality human reports, bot submissions, and Gemini integration.

---

### Feature 4: Interactive Live Telemetry Replay on Video Player
- **User Problem:** Watching a 3-minute screen recording to locate the exact second an error occurred is tedious.
- **Solution:** TryLo synchronizes video playback with a live telemetry timeline. As the founder plays or scrubs the video, real-time events (Clicks, Route Changes, Console Warnings, Network Latency, System Freezes) appear synchronously.
- **Files Modified/Created:**
  - `backend/app/services/ai_video_voice.py`: Enriched video analysis response with structured `telemetry_events` array containing second offsets, event categories, and descriptions.
  - `frontend/src/components/feedback/TimestampedVideoPlayer.tsx`:
    - Added Scrubber Dots: Interactive markers on the video progress bar colored by severity.
    - Added Tabbed Subpanel: Switch between "Timestamp Markers" and "Live Telemetry Replay".
    - Auto-Highlighting: Current active telemetry event pulses in sync with `videoRef.currentTime`.
    - 1-Click Seek: Clicking any event scrubs the video directly to that second.

---

### Feature 5: In-Browser Screen Recorder with Live Telemetry HUD
- **User Problem:** Forcing testers to install Chrome extensions or desktop software (OBS, Loom) introduces drop-off friction and security concerns.
- **Solution:** Built-in screen and audio recording natively in TryLo using browser standard APIs, featuring an interactive HUD during recording.
- **Files Modified/Created:**
  - `frontend/src/components/feedback/ScreenRecorderWidget.tsx`:
    - **Native Capture:** Uses `navigator.mediaDevices.getDisplayMedia` combined with `navigator.mediaDevices.getUserMedia`.
    - **Live Mic Audio Level Meter:** Connects microphone stream to `AudioContext` & `AnalyserNode` with `getByteFrequencyData` animation loop, rendering an animated dB volume bar in real-time.
    - **Live Telemetry HUD:** Displays live viewport resolution (e.g. `1920×1080`), total user clicks tracked during recording, and flagged bug count.
    - **1-Click "Flag Bug at MM:SS" Action:** Tester taps "Flag Bug" during live recording to bookmark the current timestamp without interrupting recording or narration.
    - **Instant Upload:** Uploads WebM chunks via `POST /api/tasks/upload-video` and attaches video + timestamp markers to the feedback report.

---

### Feature 6: 1-Click Sentinel Payout Release via Escrow Vault & Cryptographic Attestation
- **User Problem:** Releasing tester bounties manually requires switching to bank/UPI portals, manually verifying tasks, and tracking payout references.
- **Solution:** Direct 1-click bounty release directly from the Sentinel Attestation Card. TryLo locks funds in a campaign escrow pool, resolves the tester's UPI VPA, issues simulated NPCI UPI UTR numbers, and generates an immutable SHA-256 digital certificate receipt.
- **Files Modified/Created:**
  - `backend/app/models/escrow.py`: `CampaignEscrow` and `TesterPayout` models with foreign keys to `feedback_submissions`.
  - `backend/app/api/feedback.py`:
    - `POST /api/founder/feedback/{feedback_id}/release-payout`: Releases bounty, deducts from escrow, updates feedback resolution, and generates digital certificate hash.
    - `GET /api/founder/feedback/{feedback_id}/payout-status`: Returns disbursal status, UTR number, and cryptographic hash.
    - `_compute_digital_certificate_hash(...)`: Deterministic SHA-256 hash generator:
      ```python
      raw = f"TRYLO-ESCROW-PROOF:{payout_id}:{feedback_id}:{utr_number}:{amount:.2f}:{disbursed_at.isoformat()}"
      return hashlib.sha256(raw.encode("utf-8")).hexdigest()
      ```
  - `frontend/src/api/feedback.ts` & `frontend/src/context/useFeedback.ts`: `releaseFeedbackPayout` and `getFeedbackPayoutStatus` React Query hooks.
  - `frontend/src/components/feedback/AiProofSentinelCard.tsx`:
    - Pending: **"✨ 1-Click Release Bounty (₹25.00) via Escrow"** button with optional custom amount/notes.
    - Disbursed: Green settlement badge with NPCI UPI UTR pill (`UTR: 489283719482`).
    - Cryptographic Certificate Modal: Displays transaction ID, UTR, SHA-256 hash with 1-click copy, timestamp, and recipient details.
  - `backend/tests/test_ai_proof_sentinel.py`: Tests for cryptographic hash generation and schema validation.

---

### Feature 7: AI Bug Triaging & Duplicate Detection
- **Purpose:** Automatically groups similar bug reports across testers, preventing duplicate triage effort.
- **Implementation:** `backend/app/services/ai_triage.py` compares semantic tokens, route paths, and error codes to compute duplicate similarity percentages and flag existing canonical tickets.
- **Endpoint:** `POST /api/founder/feedback/{id}/ai-triage`.

---

### Feature 8: AI Executive Synthesis & Financial MRR Risk Protection
- **Purpose:** Synthesizes multiple feedback items into a high-level executive briefing for leadership, quantifying the dollar value of protected Monthly Recurring Revenue (MRR) if resolved.
- **Implementation:** `backend/app/services/ai_triage.py` (`synthesize_batch_feedback_insights`) calculates:
  - Total High/Critical Defect Count.
  - Projected Churn Prevention Percentage.
  - Protected MRR ($/month) based on severity weights.
- **Endpoint:** `POST /api/founder/feedback/executive-synthesis`.

---

### Feature 9: AI Copilot & Natural Language Question Answering
- **Purpose:** Interactive conversational partner for founders to ask complex analytical questions about their test reports (e.g. *"What are the top 3 complaints about our onboarding flow?"*).
- **Implementation:** `backend/app/services/ai_copilot.py` accepts free-form questions and cross-analyzes active campaign feedback to produce concise, actionable answers with direct citations.
- **Endpoint:** `POST /api/founder/feedback/copilot-query`.

---

### Feature 10: Synthetic Persona Audits & Pre-Launch Simulation
- **Purpose:** Before recruiting human testers, founders can run simulated automated audits using synthetic persona profiles.
- **Personas Included:**
  - *Accessibility Advocate (A11y):* Audits color contrast, ARIA landmarks, keyboard tab navigation.
  - *Performance Hawk:* Audits asset weights, hydration bottlenecks, perceived latency.
  - *Security Cynic:* Audits input sanitization, token leakage, exposed API keys.
- **Implementation:** `backend/app/services/ai_synthetic_testers.py`.
- **Endpoint:** `POST /api/founder/feedback/synthetic-audit`.

---

### Feature 11: Automated E2E Reproduction Scripts Generator
- **Purpose:** Converts human-written bug reproduction steps into executable Playwright (TypeScript) or Cypress (JavaScript) end-to-end automation test scripts.
- **Implementation:** `backend/app/services/ai_reproduction.py` generates syntactically valid code containing selectors, assertions, and timeouts.
- **Endpoint:** `POST /api/founder/feedback/{id}/generate-e2e`.

---

### Feature 12: User Journey Funnel Reconstruction & Bottleneck Analysis
- **Purpose:** Aggregates tester telemetry to visualize step-by-step user journey funnels (e.g. Landing -> Signup -> Checkout -> Success) and flags drop-off anomalies.
- **Implementation:** `backend/app/services/ai_funnel.py`.
- **Endpoint:** `GET /api/founder/feedback/funnel-analysis`.

---

### Feature 13: Voice Narration & Frustration Sentiment Analysis
- **Purpose:** Analyzes recorded video voice tracks for vocal pitch spikes, repeated hesitation phrases (*"uhm"*, *"wait where is it"*), and rapid clicking rage patterns to compute tester frustration levels.
- **Implementation:** `backend/app/services/ai_video_voice.py`.
- **Endpoint:** `GET /api/founder/feedback/{id}/video-intelligence`.

---

### Feature 14: Retest Protocols & 1-Click Issue Exporter (Jira, GitHub, Linear)
- **Purpose:** Generates structured verification protocols for QA engineers to verify bug fixes, and exports bug reports into markdown tickets pre-formatted for Jira, GitHub Issues, and Linear.
- **Implementation:** `backend/app/services/ai_retest.py` and `backend/app/services/ai_issue_exporter.py`.
- **Endpoints:**
  - `POST /api/founder/feedback/{id}/retest-protocol`
  - `POST /api/founder/feedback/{id}/export-ticket`

---

### Feature 15: Release Changelog Generator
- **Purpose:** Synthesizes resolved bug reports into public-facing release notes formatted for GitHub Releases, Twitter/X release threads, and Product Hunt announcements.
- **Implementation:** `backend/app/services/ai_changelog.py`.
- **Endpoint:** `POST /api/founder/feedback/generate-changelog`.

---

### Feature 16: Tester Feedback Polisher & Live Draft Review
- **Purpose:** Real-time writing coach for testers while drafting bug reports. Evaluates title clarity, reproduction steps completeness, and expected vs. actual behaviors, offering 1-click polishing before submission.
- **Implementation:** `backend/app/services/ai_feedback_polisher.py`.
- **Endpoints:**
  - `POST /api/feedback/evaluate-quality`
  - `POST /api/feedback/polish`

---

### Feature 17: Escrow Vault & Simulated NPCI UPI Payout Engine
- **Purpose:** Guaranteed payment protection for testers and budget control for founders.
- **Key Concepts:**
  - `CampaignEscrow`: Total bounty locked upon campaign publishing (`reward_amount * max_testers`).
  - `TesterPayout`: Individual payout records with unique simulated 12-digit NPCI UPI UTR numbers (e.g. `489283719482`).
  - Remaining balance calculation with auto-depletion flags.
- **Implementation:** `backend/app/api/payouts.py`.

---

### Feature 18: Startup Legal Entity & Anti-Shell Verification
- **Purpose:** Prevents fly-by-night fraudulent startups from harvesting tester data.
- **Verification Levels:**
  - Level 1: Domain & Corporate Email Verification (`founder@company.com`).
  - Level 2: MCA/CIN/GST Corporate Registration Document Verification.
  - Level 3: Anti-Shell Biometric & Founder Identity Attestation.
- **Implementation:** `backend/app/api/startup_verification.py`.

---

## 4. Complete API Route Map

| Method | Path | Required Role | Description |
|---|---|---|---|
| `POST` | `/api/founder/campaigns/ai-architect` | `founder` | Generates complete campaign configuration from text prompt |
| `GET` | `/api/founder/feedback/{id}/download-patch` | `founder` | Downloads unified Unix Git diff patch file |
| `GET` | `/api/founder/feedback/{id}/attestation-audit` | `founder` | Retrieves AI Proof Attestation & Anti-Fraud report |
| `POST` | `/api/founder/feedback/{id}/attestation-audit` | `founder` | Forces re-audit of tester proof and telemetry |
| `GET` | `/api/founder/feedback/{id}/payout-status` | `founder` | Checks feedback escrow disbursal status and certificate hash |
| `POST` | `/api/founder/feedback/{id}/release-payout` | `founder` | 1-Click escrow payout release with NPCI UTR and SHA-256 cert |
| `POST` | `/api/founder/feedback/{id}/ai-triage` | `founder` | Runs root-cause analysis, severity ranking, and git patch |
| `POST` | `/api/founder/feedback/executive-synthesis` | `founder` | Batch-synthesizes feedback and calculates protected MRR |
| `POST` | `/api/founder/feedback/copilot-query` | `founder` | Natural language Q&A about campaign bug reports |
| `POST` | `/api/founder/feedback/synthetic-audit` | `founder` | Runs automated pre-audit using 3 synthetic personas |
| `POST` | `/api/founder/feedback/{id}/generate-e2e` | `founder` | Generates Playwright or Cypress E2E scripts |
| `GET` | `/api/founder/feedback/funnel-analysis` | `founder` | Generates user journey bottleneck funnel analysis |
| `GET` | `/api/founder/feedback/{id}/video-intelligence` | `founder` | Analyzes video narration for emotional frustration spikes |
| `POST` | `/api/founder/feedback/{id}/retest-protocol` | `founder` | Generates structured retest verification protocol |
| `POST` | `/api/founder/feedback/{id}/export-ticket` | `founder` | Formats ticket for Jira, GitHub, or Linear |
| `POST` | `/api/founder/feedback/generate-changelog` | `founder` | Generates release notes, Twitter thread, and Product Hunt blurbs |
| `POST` | `/api/feedback/evaluate-quality` | `tester`, `founder` | Evaluates draft bug report quality score (0-100) |
| `POST` | `/api/feedback/polish` | `tester`, `founder` | Rewrites bug reports into pristine, structured format |
| `POST` | `/api/campaigns/{id}/payouts/disburse` | `founder` | General campaign payout disbursal |
| `GET` | `/api/campaigns/{id}/escrow` | `founder` | Fetches campaign escrow vault status and balance |

---

## 5. Frontend Component & Page Hierarchy

```
frontend/src/
├── pages/
│   ├── CampaignWizardPage.tsx        # 4-step wizard + AI Prompt-to-Campaign Architect Modal
│   ├── FounderFeedbackDetailPage.tsx # Main bug review page housing all AI intelligence cards
│   ├── FounderFeedbackListPage.tsx   # Triage list, filtering, executive synthesis trigger
│   ├── CampaignDetailPage.tsx        # Campaign overview, tasks, accepted testers
│   └── RegisterPage.tsx              # Clean onboarding with zero redundant banners
├── components/
│   ├── feedback/
│   │   ├── AiProofSentinelCard.tsx   # Proof Attestation, Anti-Fraud, 1-Click Escrow Release & Modal
│   │   ├── AiTriageCard.tsx          # Root-cause analysis, Unified Git Diff, 1-Click git apply
│   │   ├── TimestampedVideoPlayer.tsx# Video player with live telemetry replay & scrubber dots
│   │   ├── ScreenRecorderWidget.tsx  # In-browser screen/mic recorder with Live Telemetry HUD
│   │   ├── SyntheticAuditModal.tsx   # Synthetic persona pre-launch simulation modal
│   │   ├── LaunchRoiSimulatorModal.tsx # What-if launch ROI and churn reduction simulator
│   │   └── ReleaseChangelogModal.tsx # Auto-generated GitHub/Twitter release notes
│   ├── campaign/
│   │   └── CampaignWizardSteps.tsx   # Wizard step forms
│   └── shared/
│       ├── Header.tsx                # App navigation and user profile
│       └── StatusBadge.tsx           # Reusable status indicator
└── context/
    ├── useFeedback.ts                # React Query hooks for all AI, feedback, and escrow APIs
    └── useAuth.ts                    # Authentication context & current user role
```

---

## 6. Verification, Unit Testing & Quality Guarantees

### Automated Test Suite
All backend AI services are covered by automated unit tests in `backend/tests/`:
- `tests/test_ai_campaign_architect.py` (5 tests)
- `tests/test_ai_proof_sentinel.py` (5 tests)
- `tests/test_ai_video_voice.py` (2 tests)
- `tests/test_ai_triage.py` (2 tests)
- `tests/test_ai_copilot.py` (5 tests)
- `tests/test_ai_synthetic_testers.py` (2 tests)
- `tests/test_ai_simulator.py` (2 tests)
- `tests/test_ai_reproduction.py` (2 tests)
- `tests/test_ai_retest_and_export.py` (2 tests)
- `tests/test_ai_feedback_polisher.py` (4 tests)
- `tests/test_ai_changelog.py` (2 tests)
- `tests/test_ai_funnel.py` (2 tests)

**Total:** 35 passed unit tests executing in **< 1.0 second**.

### How to Run the Tests
```powershell
Set-Location "D:\TryLo-main\TryLo-main\backend"
.\.venv\Scripts\pytest.exe (Get-ChildItem tests/test_ai_*.py).FullName -v
```

### How to Check Frontend Type Safety
```powershell
Set-Location "D:\TryLo-main\TryLo-main\frontend"
node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit
```

---

## 7. How to Start the Development Environment

### 1. Start the Backend API Server
```powershell
Set-Location "D:\TryLo-main\TryLo-main\backend"
$env:PYTHONPATH = "D:\TryLo-main\TryLo-main\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### 2. Start the Frontend Vite Server
```powershell
Set-Location "D:\TryLo-main\TryLo-main\frontend"
npx vite --host 127.0.0.1 --port 5173
```
Application URL: `http://127.0.0.1:5173`

### 3. Demo Credentials
- **Founder Account:**
  - Email: `founder@trylo.io`
  - Password: `Password123!`
  - Role: `founder` (full access to campaign architect, feedback review, escrow disbursal)
- **Tester Account:**
  - Email: `tester@trylo.io`
  - Password: `Password123!`
  - Role: `tester` (access to screen recorder, task execution, bug submission)

---

## 8. Guidelines for Future AI Engineering Agents

When extending TryLo in the future:
1. **Always Maintain the Dual-Engine Fallback:** If adding a new AI feature, implement a deterministic heuristic fallback in Python alongside the Gemini prompt. Never assume a Gemini API key is present.
2. **Preserve Type Safety:** Always declare corresponding TypeScript interfaces in `frontend/src/api/` and Pydantic models in `backend/app/schemas/`.
3. **Escrow Invariants:** Any monetary action MUST deduct from `CampaignEscrow.disbursed_amount` and record a corresponding `TesterPayout` with a unique NPCI UTR and reference ID.
4. **Git Branching:** Ensure commits are cleanly applied to `Gaurisha-TryLo` and tested against both SQLite and standard PostgreSQL variants.
