# AI SkillProof Platform

A production-oriented, mobile-friendly web application for technical candidates to demonstrate actual competence through smart portfolios, automated coding benchmarks, AI-powered solution reviews, and cryptographically verifiable digital credentials (Ed25519 / RFC 8032).

---

## 🌟 Key Architecture & Capabilities

1. **Cryptographically Signed Digital Credentials (Ed25519)**:
   - Credentials contain canonical, deterministic JSON payloads signed on the backend using Ed25519 asymmetric keys.
   - Public verification endpoint (`GET /api/verify/:credentialId`) validates signatures in real time against tampering.
   - High-resolution scannable QR codes link directly to `/verify/:credentialId`.
   - Comprehensive revocation workflow with documented reason, audit logging, and public verification visibility.

2. **Isolated Code Execution Sandbox**:
   - Secure subprocess runner supporting **Python**, **JavaScript (Node.js)**, and **Java**.
   - Ephemeral working workspaces (`scratch/sandbox-runs/{uuid}`) with automatic cleanup.
   - Execution timeout protection (default 5000ms, automatically terminates infinite loops).
   - Memory limits and 64KB I/O buffer caps.
   - Separate public sample test cases from hidden assessment test cases (hidden test cases are strictly guarded).

3. **AI Copilot & Solution Review**:
   - Automated Big-O complexity analysis (time & space complexity discussion).
   - Clean code and readability feedback based on actual execution results.
   - AI-assisted professional bio & headline generation.
   - AI project highlights and description generator.
   - Career Skill Gap analysis with personalized learning roadmaps.

4. **Multi-Role Workspaces**:
   - **Student / Candidate**: Timed assessments, smart portfolio builder with custom slugs (`/p/:slug`), project showcase with GitHub metadata sync, credential wallet.
   - **Recruiter**: Candidate talent search filtered by verified skills and credentials, shortlists, private notes, and opportunity dispatch.
   - **Authorized Issuer**: Credential templates, criteria specification, Ed25519 digital signing, revocation control.
   - **Platform Admin**: High-level platform analytics, user role control, account suspension/restoration, issuer approval queue, problem repository, audit logs.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **npm**: v9+
- **Python**: v3.10+ (for Python sandbox challenges)

### 2. Install Dependencies
From the root directory:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Start Development Servers
From the root directory or individual directories:

**Backend (NestJS API on port 4000)**:
```bash
cd backend
npm run start:dev
```
- API Base URL: `http://localhost:4000/api`
- Interactive Swagger OpenAPI Docs: `http://localhost:4000/api/docs`

**Frontend (React + Vite on port 5173)**:
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173/`

---

## 🔑 Environment Variables & Supabase Setup

A template is provided in [`.env.example`](file:///.env.example).

### Connecting to Live Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in Supabase and run the migration scripts in order:
   - `supabase/migrations/001_initial_schema.sql` (Tables & Indexes)
   - `supabase/migrations/002_rls_policies.sql` (Row Level Security)
   - `supabase/migrations/003_storage_buckets.sql` (Storage Buckets)
   - `supabase/migrations/004_seed_data.sql` (Seed Data)
3. Set your credentials in `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Set your credentials in `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```

> [!NOTE]
> When Supabase credentials are not provided or set to defaults, the platform automatically runs in **resilient internal engine mode** with seeded challenges, candidates, and templates so you can explore and test the entire system without blocking!

---

## 🧪 Testing Verification & Sandbox

### 1. Test Code Execution Sandbox
```powershell
$body = @{
    language = "javascript"
    sourceCode = "console.log(40 + 2);"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/code-execution/run" -Method Post -ContentType "application/json" -Body $body
```

### 2. Issue and Verify Ed25519 Credential
```powershell
# Issue new signed credential
$body = @{
    recipientId = "demo-student-uuid"
    title = "Certified Algorithmic Problem Solver"
    description = "Passed rigorous automated test suites."
    criteria = "Pass Full-Stack Algorithmic Benchmark with optimal runtime."
    credentialType = "assessment_achievement"
} | ConvertTo-Json

$cred = Invoke-RestMethod -Uri "http://localhost:4000/api/credentials" -Method Post -ContentType "application/json" -Headers @{"x-dev-role"="issuer"} -Body $body

# Public signature verification
Invoke-RestMethod -Uri "http://localhost:4000/api/verify/$($cred.data.credential_id)" -Method Get
```

---

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── common/           # RBAC guards, decorators, exception filters, interceptors
│   │   ├── database/         # Supabase client & resilient datastore abstraction
│   │   ├── modules/
│   │   │   ├── auth/             # Registration, login, role management
│   │   │   ├── profiles/         # Profiles, completeness meter, evidence skills
│   │   │   ├── skills/           # Skill catalog by category
│   │   │   ├── portfolios/       # Multi-portfolio builder & public slug routing
│   │   │   ├── projects/         # Project showcase & GitHub repo metadata sync
│   │   │   ├── coding-problems/  # Benchmark challenges & test cases (public/hidden)
│   │   │   ├── code-execution/   # Ephemeral sandbox runner with timeouts (JS/Python)
│   │   │   ├── ai/               # AI bio, Big-O review, skill gap analyzer
│   │   │   ├── credentials/      # Ed25519 asymmetric cryptographic signing & revocation
│   │   │   ├── verification/     # Public verification & QR inspection endpoints
│   │   │   ├── recruiters/       # Talent search, multi-skill filtering & shortlists
│   │   │   └── admin/            # Platform analytics, moderation & audit logs
│   │   └── main.ts           # Global pipes, CORS & Swagger setup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, CodeEditor, QRModal, Badge, Button
│   │   ├── context/          # AuthContext with instant 4-role switcher
│   │   ├── pages/            # 23 complete pages covering all platform requirements
│   │   ├── services/         # Centralized API service client
│   │   ├── App.jsx           # React Router v6 routing
│   │   └── main.jsx
│   └── package.json
│
├── supabase/
│   └── migrations/           # 4 complete SQL migrations (Schema, RLS, Storage, Seeds)
├── .env.example              # Centralized environment variable template
└── README.md
```
