# ABI — Business Intelligence Assistant

MVP de asistente de inteligencia de negocios con IA. Sube archivos Excel, CSV o JSON, obtén métricas automáticas, dashboards y respuestas en lenguaje natural sobre tus datos.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js, TypeScript, TailwindCSS, Shadcn UI, TanStack Query |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic, Pydantic |
| Datos | PostgreSQL, Pandas, Polars, DuckDB (Sprint 2+) |
| IA | OpenAI GPT (Sprint 4) |

## Estructura Monorepo

```
ABI/
├── frontend/          # Next.js UI
├── backend/           # FastAPI API
├── docker/            # Docker Compose + Dockerfiles
├── docs/              # Especificaciones
├── scripts/           # Utilidades de desarrollo
└── .github/workflows/ # CI
```

## Inicio rápido

### 1. Variables de entorno

```bash
cp .env.example .env
```

### 2. Con Docker (recomendado)

```bash
docker compose -f docker/docker-compose.yml up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. Desarrollo local (sin Docker completo)

**PostgreSQL** (solo DB — usa puerto **5433** para evitar conflicto con Postgres local en Windows):

```bash
docker compose -f docker/docker-compose.yml up -d postgres
```

> Si ya tenías el contenedor en el puerto 5432, recrea el servicio:
> `docker compose -f docker/docker-compose.yml up -d postgres --force-recreate`

**Backend:**

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Sprint 0 — Completado

- [x] Monorepo inicializado con Git
- [x] FastAPI skeleton + health check
- [x] PostgreSQL + Alembic (tabla `users`)
- [x] JWT auth: register, login, refresh, me
- [x] Next.js + Shadcn UI + TanStack Query
- [x] Pantallas login / register / dashboard shell
- [x] Docker Compose
- [x] CI (GitHub Actions)

## Sprint 1 — Completado

- [x] Migraciones `datasets`, `dataset_columns`, `dataset_rows`
- [x] `POST /api/v1/datasets/upload` (CSV, Excel, JSON)
- [x] Pipeline Pandas + inferencia de tipos
- [x] `GET /datasets`, `GET /datasets/{id}`, `GET /datasets/{id}/preview`
- [x] `DELETE /datasets/{id}` (soft delete)
- [x] UI: drag & drop upload + tabla de datasets + detalle con preview

## Sprint 2 — Completado

- [x] Motor de analytics (sum, avg, min, max, std_dev, top categorías)
- [x] Tabla `analytics_cache` + cálculo automático al subir
- [x] `GET /analytics/{dataset_id}` + `POST /analytics/{id}/refresh`
- [x] UI: `/analytics` + `/analytics/[id]` con cards de métricas

## Sprint 3 — Completado

- [x] Motor de recomendación de gráficos ampliado (KPI, línea, área, barras, barras horizontales, histograma, scatter, pastel, dona)
- [x] `GET /dashboard/{dataset_id}` con datos pre-agregados
- [x] Filtro por rango de fechas (`date_from`, `date_to`)
- [x] UI: `/analytics/[id]` con gráficos (barras, línea, pastel) + métricas por columna
- [x] Filtro por rango de fechas en sección gráfica

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check + DB status |
| POST | `/api/v1/auth/register` | Registro |
| POST | `/api/v1/auth/login` | Login → JWT |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Usuario actual (requiere JWT) |
| POST | `/api/v1/datasets/upload` | Subir archivo (multipart) |
| GET | `/api/v1/datasets` | Listar datasets del usuario |
| GET | `/api/v1/datasets/{id}` | Detalle + schema |
| GET | `/api/v1/datasets/{id}/preview` | Primeras 100 filas |
| DELETE | `/api/v1/datasets/{id}` | Soft delete |
| GET | `/api/v1/analytics/{id}` | Perfil analítico (KPIs) |
| POST | `/api/v1/analytics/{id}/refresh` | Recalcular analytics |
| GET | `/api/v1/dashboard/{id}` | Dashboard auto-generado (widgets + datos) |

## Próximo paso

**Sprint 4:** AI Chat con consultas en lenguaje natural (`POST /ai/chat`).
