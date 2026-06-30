# ABI — Business Intelligence Assistant
## Technical Specification (MVP)

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Status** | Draft — Pre-implementation |
| **Author** | Architecture Team |
| **Last Updated** | 2026-06-24 |

---

## Executive Summary

ABI (Business Intelligence Assistant) is an MVP platform that enables users to upload tabular data (Excel, CSV, JSON), persist it in PostgreSQL, automatically profile and visualize metrics, and ask natural-language questions answered by AI over their own data.

**Core value proposition:** Zero-config analytics — upload a file, get dashboards and AI insights in minutes.

---

## 1. Functional Requirements

### 1.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Users can register with email and password | P1 |
| FR-AUTH-02 | Users can log in and receive a JWT access token + refresh token | P1 |
| FR-AUTH-03 | All dataset and analytics endpoints require valid JWT | P1 |
| FR-AUTH-04 | Users can only access their own datasets (row-level isolation) | P1 |
| FR-AUTH-05 | Users can log out (client-side token invalidation; optional server blocklist in v2) | P2 |

### 1.2 Dataset Management (Sprint 1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DS-01 | Upload files via drag-and-drop or file picker (`.xlsx`, `.xls`, `.csv`, `.json`) | P0 |
| FR-DS-02 | Validate file type, size (max 50 MB MVP), and row count (max 1M rows MVP) | P0 |
| FR-DS-03 | Parse file and store rows in PostgreSQL (dynamic table per dataset) | P0 |
| FR-DS-04 | Persist dataset metadata: name, columns, types, row count, file hash, upload date | P0 |
| FR-DS-05 | List all datasets for the authenticated user | P0 |
| FR-DS-06 | View dataset detail (schema, sample rows, status) | P1 |
| FR-DS-07 | Soft-delete datasets (mark `deleted_at`, hide from UI) | P1 |
| FR-DS-08 | Re-upload / replace dataset (creates new version, links to parent) | P2 |

### 1.3 Automatic Analytics (Sprint 2)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AN-01 | Auto-detect column types: numeric, date/datetime, categorical, text, boolean | P0 |
| FR-AN-02 | Compute per-numeric-column: sum, avg, min, max, count, std_dev | P0 |
| FR-AN-03 | Compute per-categorical-column: unique count, top-N values with frequency | P0 |
| FR-AN-04 | Compute per-date-column: min date, max date, granularity hint | P0 |
| FR-AN-05 | Generate dataset-level summary (total rows, total columns, null % per column) | P0 |
| FR-AN-06 | Cache analytics results; invalidate on dataset update | P1 |
| FR-AN-07 | Expose analytics via `GET /api/v1/analytics/{dataset_id}` | P0 |

### 1.4 Dashboard & Visualization (Sprint 3)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-VIZ-01 | Auto-generate chart recommendations based on column types | P0 |
| FR-VIZ-02 | Line chart for time-series (date + numeric) | P0 |
| FR-VIZ-03 | Bar chart for categorical vs numeric aggregation | P0 |
| FR-VIZ-04 | Pie/donut chart for categorical distribution (≤ 12 categories) | P1 |
| FR-VIZ-05 | KPI cards for key numeric metrics (sum, avg, max) | P0 |
| FR-VIZ-06 | Dashboard layout auto-arranged; user can reorder (local state MVP) | P2 |
| FR-VIZ-07 | Date range filter when date column detected | P1 |

### 1.5 AI Natural Language Queries (Sprint 4)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AI-01 | Chat interface to ask questions about uploaded data | P0 |
| FR-AI-02 | AI generates read-only SQL against dataset (DuckDB in-memory) | P0 |
| FR-AI-03 | Execute SQL safely; return tabular result + natural language explanation | P0 |
| FR-AI-04 | Support Spanish and English queries | P1 |
| FR-AI-05 | Show generated SQL to user (transparency toggle) | P1 |
| FR-AI-06 | Conversation history per dataset session | P1 |
| FR-AI-07 | Structured output schema for SQL + explanation + optional chart hint | P0 |
| FR-AI-08 | Rate limit: 20 queries/hour per user (MVP) | P1 |

### 1.6 Supported File Examples

```
fecha,ventas
2025-01,100
2025-02,200
```

Expected detections: `fecha` → date, `ventas` → numeric.  
Expected outputs: sum/avg/max/min for `ventas`; line chart over `fecha`.

---

## 2. Non-Functional Requirements

### 2.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | File upload + parse (≤ 10K rows) | < 5 s |
| NFR-PERF-02 | Analytics generation (≤ 100K rows) | < 10 s |
| NFR-PERF-03 | Dashboard initial load | < 3 s |
| NFR-AI-01 | AI query end-to-end (≤ 50K rows) | < 15 s |
| NFR-PERF-04 | API p95 latency (non-AI endpoints) | < 500 ms |

### 2.2 Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCALE-01 | Stateless API servers; horizontal scaling ready |
| NFR-SCALE-02 | PostgreSQL connection pooling (PgBouncer or SQLAlchemy pool) |
| NFR-SCALE-03 | Async file processing via background task (Celery/ARQ — Sprint 2+) |

### 2.3 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | JWT HS256/RS256; access token TTL 15 min, refresh 7 days |
| NFR-SEC-02 | Passwords hashed with bcrypt (cost ≥ 12) |
| NFR-SEC-03 | AI-generated SQL: read-only, no DDL/DML, parameterized where possible |
| NFR-SEC-04 | SQL sandbox: DuckDB in-memory; no network extensions |
| NFR-SEC-05 | Input sanitization on all upload filenames and chat messages |
| NFR-SEC-06 | CORS restricted to frontend origin |
| NFR-SEC-07 | Secrets via environment variables only |

### 2.4 Reliability & Availability

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | API health check `GET /health` |
| NFR-REL-02 | Graceful degradation if OpenAI unavailable (show cached analytics, disable chat) |
| NFR-REL-03 | Database migrations via Alembic; zero-downtime deploy strategy documented |

### 2.5 Observability

| ID | Requirement |
|----|-------------|
| NFR-OBS-01 | Structured JSON logging (request_id, user_id, dataset_id) |
| NFR-OBS-02 | OpenAI token usage logged per request |
| NFR-OBS-03 | Error tracking integration ready (Sentry hook in config) |

### 2.6 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-MAINT-01 | Clean Architecture layers enforced |
| NFR-MAINT-02 | Test coverage target ≥ 80% backend, ≥ 70% frontend critical paths |
| NFR-MAINT-03 | OpenAPI auto-generated and versioned at `/api/v1/docs` |

### 2.7 Compatibility

| ID | Requirement |
|----|-------------|
| NFR-COMPAT-01 | Browsers: Chrome, Firefox, Edge (last 2 versions) |
| NFR-COMPAT-02 | Responsive UI: desktop-first, tablet usable |

---

## 3. Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│                   Next.js 15 + TanStack Query                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Application                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ API Layer│→ │ Service Layer│→ │Repository│→ │  PostgreSQL │  │
│  └──────────┘  └──────┬───────┘  └──────────┘  └─────────────┘  │
│                       │                                          │
│         ┌─────────────┼─────────────┐                            │
│         ▼             ▼             ▼                            │
│  ┌────────────┐ ┌───────────┐ ┌──────────┐                      │
│  │Data Engine │ │ Analytics │ │ AI Agent │                      │
│  │Pandas/Polars│ │  Service  │ │  Chain   │                      │
│  │  DuckDB    │ └───────────┘ └────┬─────┘                      │
│  └────────────┘                     │                            │
└─────────────────────────────────────┼────────────────────────────┘
                                      ▼
                              ┌──────────────┐
                              │  OpenAI API  │
                              │  (GPT-4o)    │
                              └──────────────┘
```

### 3.2 Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│  Presentation  │  FastAPI routers (api/) │
├────────────────┼─────────────────────────┤
│  Application   │  Services (services/)   │
├────────────────┼─────────────────────────┤
│  Domain        │  Models, business rules │
├────────────────┼─────────────────────────┤
│  Infrastructure│  Repos, DB, AI, engines │
└────────────────┴─────────────────────────┘
```

**Dependency rule:** Inner layers never depend on outer layers. Services depend on repository interfaces (protocols), not concrete DB implementations.

### 3.3 Data Flow — Upload

```
User → Upload UI → POST /datasets/upload
  → UploadService validates file
  → PandasEngine parses → PolarsEngine normalizes types
  → DatasetRepository saves metadata
  → DataRepository bulk-inserts rows (PostgreSQL JSONB or dynamic table)
  → Returns dataset_id + schema preview
```

### 3.4 Data Flow — AI Query

```
User question → POST /ai/chat
  → AIService loads dataset schema + sample rows
  → GPT (function calling) → generates DuckDB SQL
  → DuckDBEngine executes (in-memory from Parquet/CSV export)
  → GPT explains result in natural language
  → Returns: answer, sql, data, optional chart_config
```

### 3.5 Technology Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| API | FastAPI | Async, OpenAPI, Pydantic native |
| ORM | SQLAlchemy 2.0 | Mature, Alembic support |
| Frontend state | TanStack Query | Server state caching, mutations |
| Charts | Recharts | React-native, composable |
| Analytics compute | Polars primary, Pandas fallback | Speed on large files |
| AI SQL sandbox | DuckDB | Fast analytical SQL, in-process |
| Auth | JWT (python-jose + passlib) | Stateless, MVP-simple |

### 3.6 Bounded Contexts (DDD)

| Context | Aggregates | Responsibilities |
|---------|------------|------------------|
| **Identity** | User | Registration, login, JWT |
| **Datasets** | Dataset, DatasetVersion | Upload, storage, schema |
| **Analytics** | AnalyticsProfile, Metric | Profiling, KPIs |
| **Visualization** | ChartConfig, Dashboard | Auto charts, layout |
| **AI Assistant** | ChatSession, ChatMessage | NL → SQL → explanation |

---

## 4. Folder Structure

```
ABI/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── datasets/
│   │   │   │   ├── analytics/[id]/
│   │   │   │   ├── dashboard/[id]/
│   │   │   │   └── chat/[id]/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # Shadcn primitives
│   │   │   ├── charts/
│   │   │   ├── upload/
│   │   │   ├── dashboard/
│   │   │   └── chat/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── datasets/
│   │   │   ├── analytics/
│   │   │   └── ai-chat/
│   │   ├── services/               # API client wrappers
│   │   ├── hooks/
│   │   ├── lib/                    # utils, api client, auth
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── datasets.py
│   │   │   │   ├── analytics.py
│   │   │   │   ├── dashboard.py
│   │   │   │   └── ai.py
│   │   │   └── deps.py             # DI, current_user
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── dataset.py
│   │   │   └── chat.py
│   │   ├── schemas/                # Pydantic DTOs
│   │   ├── repositories/
│   │   ├── services/
│   │   │   ├── upload_service.py
│   │   │   ├── dataset_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── dashboard_service.py
│   │   │   └── ai_service.py
│   │   ├── data_engine/
│   │   │   ├── pandas_engine.py
│   │   │   ├── polars_engine.py
│   │   │   └── duckdb_engine.py
│   │   ├── ai/
│   │   │   ├── prompts/
│   │   │   ├── chains/
│   │   │   └── agents/
│   │   ├── tests/
│   │   └── main.py
│   ├── alembic/
│   ├── requirements.txt
│   └── pyproject.toml
│
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
│
├── docs/
│   ├── TECHNICAL_SPECIFICATION.md  # This document
│   ├── API.md                      # Generated + curated
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
│
├── scripts/
│   ├── init_db.sh
│   └── seed_dev.py
│
├── .cursor/
├── .env.example
└── README.md
```

---

## 5. Database Schema

### 5.1 ERD (Conceptual)

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    users     │       │    datasets      │       │ dataset_columns │
├──────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)      │──┐    │ id (PK)          │──┐    │ id (PK)         │
│ email        │  └───→│ user_id (FK)     │  └───→│ dataset_id (FK) │
│ password_hash│       │ name             │       │ name            │
│ created_at   │       │ original_filename│       │ inferred_type   │
│ updated_at   │       │ file_type        │       │ null_count      │
│ deleted_at   │       │ row_count        │       │ sample_values   │
└──────────────┘       │ column_count     │       └─────────────────┘
                       │ status           │
                       │ storage_table    │       ┌─────────────────┐
                       │ file_hash        │       │analytics_cache  │
                       │ created_at       │──────→│ id (PK)         │
                       │ updated_at       │       │ dataset_id (FK) │
                       │ deleted_at       │       │ profile_json    │
                       └──────────────────┘       │ computed_at     │
                                                    └─────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  chat_sessions   │       │  chat_messages   │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │──┐    │ id (PK)          │
│ user_id (FK)     │  └───→│ session_id (FK)  │
│ dataset_id (FK)  │       │ role             │
│ created_at       │       │ content          │
└──────────────────┘       │ sql_generated    │
                           │ result_json      │
                           │ tokens_used      │
                           │ created_at       │
                           └──────────────────┘
```

### 5.2 Table Definitions

#### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `gen_random_uuid()` |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(255) | NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| deleted_at | TIMESTAMPTZ | NULL (soft delete) |

#### `datasets`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| original_filename | VARCHAR(512) | NOT NULL |
| file_type | VARCHAR(10) | ENUM: csv, xlsx, json |
| row_count | INTEGER | DEFAULT 0 |
| column_count | INTEGER | DEFAULT 0 |
| status | VARCHAR(20) | pending, processing, ready, error |
| storage_table | VARCHAR(128) | Physical table name for row data |
| file_hash | VARCHAR(64) | SHA-256 for dedup |
| error_message | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL |

#### `dataset_columns`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| dataset_id | UUID | FK → datasets.id |
| name | VARCHAR(255) | NOT NULL |
| position | INTEGER | NOT NULL |
| inferred_type | VARCHAR(20) | numeric, date, categorical, text, boolean |
| null_count | INTEGER | DEFAULT 0 |
| distinct_count | INTEGER | NULL |
| sample_values | JSONB | NULL |
| stats_json | JSONB | NULL (min, max, sum, avg for numeric) |

#### `dataset_rows` (dynamic — alternative: JSONB per row)

**Strategy MVP:** One physical table per dataset: `ds_{dataset_id_short}` with columns matching inferred types. Managed by migration service on upload.

#### `analytics_cache`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| dataset_id | UUID | FK, UNIQUE |
| profile_json | JSONB | Full analytics profile |
| computed_at | TIMESTAMPTZ | NOT NULL |

#### `chat_sessions` / `chat_messages`

As shown in ERD. Messages store `role` ∈ {user, assistant, system}.

### 5.3 Indexes

```sql
CREATE INDEX idx_datasets_user_id ON datasets(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dataset_columns_dataset_id ON dataset_columns(dataset_id);
CREATE INDEX idx_chat_sessions_user_dataset ON chat_sessions(user_id, dataset_id);
```

---

## 6. API Design

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <access_token>`  
**Response envelope:**

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

**Error envelope:**

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DATASET_NOT_FOUND",
    "message": "Dataset not found",
    "details": {}
  }
}
```

### 6.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Current user profile |

**POST `/auth/login`**

Request:
```json
{ "email": "user@example.com", "password": "secret" }
```

Response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 900
  }
}
```

### 6.2 Datasets (Sprint 1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/datasets/upload` | Multipart file upload |
| GET | `/datasets` | List user datasets (paginated) |
| GET | `/datasets/{id}` | Dataset detail + schema |
| GET | `/datasets/{id}/preview` | First 100 rows |
| DELETE | `/datasets/{id}` | Soft delete |

**POST `/datasets/upload`**

- Content-Type: `multipart/form-data`
- Fields: `file` (required), `name` (optional)

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ventas Q1",
    "status": "processing",
    "columns": [
      { "name": "fecha", "type": "date" },
      { "name": "ventas", "type": "numeric" }
    ],
    "row_count": 2
  }
}
```

### 6.3 Analytics (Sprint 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/{dataset_id}` | Full analytics profile |
| POST | `/analytics/{dataset_id}/refresh` | Force recompute |

**GET `/analytics/{dataset_id}`**

Response:
```json
{
  "success": true,
  "data": {
    "dataset_id": "uuid",
    "computed_at": "2026-06-24T10:00:00Z",
    "summary": {
      "row_count": 2,
      "column_count": 2
    },
    "columns": [
      {
        "name": "ventas",
        "type": "numeric",
        "metrics": {
          "sum": 300,
          "avg": 150,
          "min": 100,
          "max": 200,
          "count": 2
        }
      },
      {
        "name": "fecha",
        "type": "date",
        "metrics": {
          "min": "2025-01",
          "max": "2025-02"
        }
      }
    ]
  }
}
```

### 6.4 Dashboard (Sprint 3)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/{dataset_id}` | Auto-generated dashboard config + data |

Response includes `widgets[]` with `type` ∈ {kpi, line, bar, pie} and pre-aggregated `data`.

### 6.5 AI Chat (Sprint 4)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/chat` | Send message, get answer |
| GET | `/ai/sessions/{dataset_id}` | List chat sessions |
| GET | `/ai/sessions/{session_id}/messages` | Message history |

**POST `/ai/chat`**

Request:
```json
{
  "dataset_id": "uuid",
  "session_id": "uuid-or-null",
  "message": "¿Cuál fue mi mejor mes de ventas?"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "answer": "Tu mejor mes fue febrero 2025 con 200 en ventas.",
    "sql": "SELECT fecha, ventas FROM data ORDER BY ventas DESC LIMIT 1",
    "result": [{ "fecha": "2025-02", "ventas": 200 }],
    "chart_hint": { "type": "bar", "x": "fecha", "y": "ventas" },
    "tokens_used": 450
  }
}
```

### 6.6 Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness + DB connectivity |

---

## 7. User Stories

### Epic: Dataset Management

| Story | As a... | I want to... | So that... | Acceptance Criteria |
|-------|---------|--------------|------------|---------------------|
| US-1.1 | user | upload an Excel/CSV/JSON file | analyze my business data | File uploads, validates, shows in list within 10s |
| US-1.2 | user | see all my uploaded datasets | track what I've imported | Table shows name, date, rows, status |
| US-1.3 | user | preview dataset rows | verify data loaded correctly | First 100 rows displayed |
| US-1.4 | user | delete a dataset | remove incorrect uploads | Soft delete, removed from list |

### Epic: Automatic Analytics

| Story | As a... | I want to... | So that... | Acceptance Criteria |
|-------|---------|--------------|------------|---------------------|
| US-2.1 | user | see auto-detected column types | understand my data structure | Types shown per column |
| US-2.2 | user | view sum/avg/min/max | get quick KPIs | Metrics for all numeric columns |
| US-2.3 | user | see top categories | understand distribution | Top 10 values per categorical column |

### Epic: Dashboard

| Story | As a... | I want to... | So that... | Acceptance Criteria |
|-------|---------|--------------|------------|---------------------|
| US-3.1 | user | see auto-generated charts | visualize trends without config | ≥ 1 chart per suitable column pair |
| US-3.2 | user | see KPI cards | monitor key numbers | Cards for primary numeric metrics |
| US-3.3 | user | filter by date range | focus on a period | Chart data updates on filter |

### Epic: AI Assistant

| Story | As a... | I want to... | So that... | Acceptance Criteria |
|-------|---------|--------------|------------|---------------------|
| US-4.1 | user | ask questions in Spanish | get insights naturally | Correct answer for sample queries |
| US-4.2 | user | see the SQL used | trust the answer | SQL visible in expandable panel |
| US-4.3 | user | continue a conversation | ask follow-up questions | Session persists messages |

### Epic: Authentication

| Story | As a... | I want to... | So that... | Acceptance Criteria |
|-------|---------|--------------|------------|---------------------|
| US-0.1 | user | register and login | access my private data | JWT issued, protected routes work |
| US-0.2 | user | only see my datasets | keep data private | Cross-user access returns 403 |

---

## 8. Sprint Planning

### Sprint 0 — Project Setup (3 days)

| Task | Owner | Est. |
|------|-------|------|
| Initialize monorepo structure | Dev | 2h |
| Docker Compose (Postgres, backend, frontend) | Dev | 4h |
| FastAPI skeleton + health check | Backend | 2h |
| Next.js 15 skeleton + Shadcn setup | Frontend | 4h |
| Alembic + initial migration (users) | Backend | 3h |
| JWT auth (register, login, me) | Backend | 6h |
| Auth UI (login, register) | Frontend | 6h |
| CI pipeline (lint, test) | DevOps | 4h |
| `.env.example` + README | Dev | 2h |

**Sprint 0 DoD:** User can register, login, see empty dashboard shell.

---

### Sprint 1 — Dataset Upload (1 week)

| Task | Layer | Est. |
|------|-------|------|
| `datasets` + `dataset_columns` migrations | Backend | 3h |
| `POST /datasets/upload` endpoint | Backend | 8h |
| Pandas/Polars parse pipeline | Backend | 6h |
| Dynamic table creation + bulk insert | Backend | 8h |
| `GET /datasets`, `GET /datasets/{id}` | Backend | 4h |
| Upload page (drag & drop) | Frontend | 8h |
| Datasets table component | Frontend | 4h |
| TanStack Query hooks for datasets | Frontend | 4h |
| Unit tests: upload service | Backend | 4h |
| Integration test: upload flow | Backend | 4h |

**Sprint 1 DoD:** User uploads CSV → sees dataset in table with schema and row count.

---

### Sprint 2 — Analytics Engine (1 week)

| Task | Layer | Est. |
|------|-------|------|
| Column type inference engine | Backend | 8h |
| Metrics computation (numeric, categorical, date) | Backend | 8h |
| `analytics_cache` table + service | Backend | 4h |
| `GET /analytics/{dataset_id}` | Backend | 4h |
| Trigger analytics on upload complete | Backend | 2h |
| Analytics detail page | Frontend | 8h |
| Column metrics cards | Frontend | 4h |
| Tests: analytics service | Backend | 6h |

**Sprint 2 DoD:** After upload, analytics page shows types and KPIs automatically.

---

### Sprint 3 — Dashboard (1 week)

| Task | Layer | Est. |
|------|-------|------|
| Chart recommendation engine | Backend | 8h |
| `GET /dashboard/{dataset_id}` | Backend | 6h |
| KPI, Line, Bar, Pie components (Recharts) | Frontend | 10h |
| Dashboard layout page | Frontend | 6h |
| Date range filter | Frontend | 4h |
| Tests: chart config generation | Backend | 4h |

**Sprint 3 DoD:** Dashboard auto-renders charts and KPIs for sample sales dataset.

---

### Sprint 4 — AI Assistant (1.5 weeks)

| Task | Layer | Est. |
|------|-------|------|
| DuckDB engine (load dataset, execute SQL) | Backend | 8h |
| AI prompts + structured output schema | Backend | 6h |
| SQL validation (read-only guard) | Backend | 4h |
| `POST /ai/chat` + session persistence | Backend | 10h |
| Chat UI component | Frontend | 10h |
| SQL transparency panel | Frontend | 3h |
| Token usage logging | Backend | 2h |
| E2E test: sample NL queries | QA | 6h |
| Rate limiting middleware | Backend | 3h |

**Sprint 4 DoD:** User asks "¿Cuál fue mi mejor mes de ventas?" and gets correct answer + SQL.

---

## 9. Notion Kanban Structure

### Workspace Hierarchy

```
📁 ABI — Business Intelligence Assistant
├── 📄 Product Vision
├── 📄 Technical Specification (link to docs/)
├── 📋 Epic Board (Database)
└── 📋 Sprint Board (Database)
```

### Epic Database Properties

| Property | Type | Options |
|----------|------|---------|
| Name | Title | — |
| Status | Select | Backlog, Ready, In Progress, Review, Testing, Done |
| Priority | Select | P0, P1, P2 |
| Sprint | Relation → Sprint Board | — |
| Story Points | Number | — |
| Owner | Person | — |
| Acceptance Criteria | Text | — |

### Epics (Rows)

| Epic | Sprint | Points | Priority |
|------|--------|--------|----------|
| Project Setup | Sprint 0 | 13 | P0 |
| Dataset Upload | Sprint 1 | 21 | P0 |
| Database & Migrations | Sprint 1 | 8 | P0 |
| Authentication | Sprint 0 | 13 | P0 |
| Analytics Engine | Sprint 2 | 21 | P0 |
| KPIs & Data Profiling | Sprint 2 | 13 | P0 |
| Dashboard | Sprint 3 | 21 | P0 |
| Charts | Sprint 3 | 13 | P0 |
| Filters | Sprint 3 | 5 | P1 |
| AI Assistant | Sprint 4 | 34 | P0 |
| Natural Language Queries | Sprint 4 | 21 | P0 |
| Prompt Engineering | Sprint 4 | 8 | P0 |

### Sprint Board (Kanban)

**Columns:** Backlog → Ready → In Progress → Review → Testing → Done

**Sprint 1 Tasks (example cards):**

- [Backend] Crear FastAPI skeleton
- [Backend] Config PostgreSQL + Alembic
- [Backend] Endpoint `POST /datasets/upload`
- [Backend] Guardar metadata en `datasets`
- [Frontend] Pantalla Upload con Drag & Drop
- [Frontend] Tabla de datasets
- [DevOps] Docker Compose local

### Task Card Template

```
Title: [Layer] Short description
Epic: Dataset Upload
Sprint: Sprint 1
Status: Backlog
Owner: —
Story Points: —
Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
Dependencies: —
```

---

## 10. Development Roadmap

### Phase 1 — MVP (Weeks 1–6)

```
Week 1   ████████░░  Sprint 0: Setup + Auth
Week 2   ██████████  Sprint 1: Dataset Upload
Week 3   ██████████  Sprint 2: Analytics
Week 4   ██████████  Sprint 3: Dashboard
Week 5-6 ██████████  Sprint 4: AI Chat
```

**MVP Exit Criteria:**
- [ ] User can register, login, upload CSV/Excel/JSON
- [ ] Data stored in PostgreSQL with inferred schema
- [ ] Analytics auto-generated (sum, avg, min, max, types)
- [ ] Dashboard with line, bar, pie charts + KPI cards
- [ ] AI answers 5 canonical test questions correctly
- [ ] Deployed locally via Docker Compose
- [ ] ≥ 80% backend test coverage on services

### Phase 2 — Enhancement (Weeks 7–10)

| Feature | Description |
|---------|-------------|
| Multi-sheet Excel | Support multiple sheets, user selects |
| Dataset versioning | Re-upload creates version history |
| Export | Download query results as CSV |
| Shared dashboards | Read-only share links |
| Background jobs | Celery for large file processing |
| Caching | Redis for analytics cache |

### Phase 3 — Scale (Weeks 11–16)

| Feature | Description |
|---------|-------------|
| Team workspaces | Multi-user org accounts |
| RBAC | Admin, analyst, viewer roles |
| Scheduled reports | Email PDF/CSV on cron |
| Custom SQL mode | Power users write SQL directly |
| Additional AI models | Fallback to Claude/Gemini |
| Cloud deploy | AWS/GCP with managed Postgres |

### Phase 4 — Enterprise (Future)

- SSO (OAuth2/OIDC)
- Audit logs
- Data encryption at rest
- SLA monitoring
- White-label branding

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Large files crash API memory | High | Medium | Stream parsing; row limits; background jobs in Phase 2 |
| AI generates invalid/unsafe SQL | High | Medium | Read-only DuckDB sandbox; SQL validator; allowlist of functions |
| OpenAI latency/cost | Medium | High | Cache schema context; use gpt-5.4-mini; token budgets |
| Dynamic table management complexity | Medium | Medium | JSONB row storage as fallback; strict naming convention |
| Type inference errors | Medium | High | Show inferred types in UI; allow manual override in Phase 2 |
| Scope creep in MVP | High | High | Strict sprint boundaries; defer filters/sharing to Phase 2 |

---

## Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Backend unit | pytest | Services, engines, validators |
| Backend integration | pytest + testcontainers | DB, upload flow |
| API contract | schemathesis / OpenAPI | Endpoint schemas |
| Frontend unit | Vitest | Hooks, utils |
| Frontend component | Testing Library | Upload, charts |
| E2E | Playwright | Auth → upload → dashboard → chat |

**Canonical E2E dataset:** `fecha,ventas` with 12 monthly rows for trend and max queries.

---

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql+asyncpg://abi:abi@localhost:5432/abi
SECRET_KEY=change-me-in-production
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
MAX_UPLOAD_SIZE_MB=50
CORS_ORIGINS=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Appendix A — AI Prompt Architecture (Sprint 4)

### System Prompt (summary)

```
You are ABI, a data analyst assistant. You have access to a single dataset.
Given the schema and sample rows, generate DuckDB-compatible SELECT queries only.
Never use INSERT, UPDATE, DELETE, DROP, or DDL.
Respond in the user's language.
```

### Structured Output Schema

```json
{
  "sql": "string",
  "explanation": "string",
  "chart_hint": {
    "type": "line|bar|pie|none",
    "x_column": "string|null",
    "y_column": "string|null"
  }
}
```

### Function Calling Flow

1. `get_dataset_schema(dataset_id)` — tool returns columns + samples
2. Model returns structured SQL
3. Backend executes via DuckDBEngine
4. Second model call explains results with data context

---

## Appendix B — Glossary

| Term | Definition |
|------|------------|
| Dataset | A uploaded file and its persisted tabular data |
| Analytics Profile | Computed metrics and type inference for a dataset |
| DuckDB Sandbox | In-memory analytical DB for safe AI SQL execution |
| Soft Delete | Record marked `deleted_at`, not physically removed |

---

*End of Technical Specification v1.0.0*
