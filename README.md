# 🌬️ PPC HackITall — Renewable Energy: From Weather to Power

**Team 05 — Hyped Coders**

An end-to-end data platform for a wind-farm operator: it ingests near-real-time turbine and weather telemetry, cleans and validates it, stores it in a warehouse, and exposes it through a secured API and a live operations dashboard — so the control room (and the Transport System Operator) can trust the numbers behind every report.

---

## 1. The Problem

A wind-farm operator runs turbines across several parks. Every turbine streams sensor data (wind speed, active power, component temperatures) into an S3 data lake every 15 minutes, alongside static turbine/park metadata and an external weather feed used as a fallback when a sensor goes quiet.

The Transport System Operator (TSO) needs two things out of this data:

- A **daily 09:00 operational report** — production by type/park, availability, and turbine status.
- A **near-real-time graph** (15-minute and hourly) of temperature, wind speed, and active power, to catch **data gaps** (turbines that stop reporting) and **discrepancies** (e.g. high wind but zero output — fault or a planned stop?).

The raw data isn't clean: inconsistent formats, duplicates, and sensor faults are common. Get the reporting wrong and it leads to penalties and bad operational decisions.

## 2. What We Built

The solution is split into the two hackathon tracks, wired together into one working system:

| Component | Track | Purpose |
|---|---|---|
| [`data_pipeline/`](./data_pipeline) | A — Data Engineering & DQ | Python ETL that reads raw parquet from S3, applies data-quality rules, resamples to 15-minute buckets, and loads a PostgreSQL warehouse. |
| [`backend_api/`](./backend_api) | B — Microservices | Spring Boot REST API: authentication, multi-tenant access control, KPIs, analytics, the external client API, and the scheduled TSO report. |
| [`front_end/map/`](./front_end/map) | B — Microservices | React + Leaflet operations dashboard: park map, live charts, faulty-sensor terminal, tenant administration, report export. |

## 3. Architecture

```
                 ┌────────────────────────┐
                 │   S3 Data Lake (RAW)   │
                 │  meteo / park / wtg    │
                 └───────────┬────────────┘
                             │ parquet, every 15 min
                             ▼
                 ┌────────────────────────┐
                 │  data_pipeline (Python)│
                 │  extract → DQ → merge  │
                 │  → resample → load     │
                 └───────────┬────────────┘
                             │ triggered every 5 min
                             │ by the Spring scheduler
                             ▼
                 ┌────────────────────────┐
                 │   PostgreSQL warehouse │
                 │  sensor/meteo readings │
                 │  rejected_*, audit log │
                 └───────────┬────────────┘
                             ▼
                 ┌────────────────────────┐
                 │  backend_api (Spring)  │
                 │  JWT auth · RBAC       │
                 │  KPI / analytics APIs  │
                 │  09:00 TSO report job  │
                 └───────────┬────────────┘
                             │ REST (JSON)
                             ▼
                 ┌────────────────────────┐
                 │ front_end/map (React)  │
                 │ live map · charts      │
                 │ faulty-sensor terminal │
                 └────────────────────────┘
```

The backend schedules the Python pipeline as a subprocess every 5 minutes (`DataPipelineScheduler`), so the whole ingestion → warehouse → API chain runs unattended, and the TSO CSV report is generated automatically at 09:00 daily (`TsoReportScheduler`).

## 4. Repository Structure

```
.
├── DataDictionary.md          # Source schema reference (S3 layout, tag naming, sensor codes)
├── backend_api/                # Spring Boot 4 / Java 25 REST API
│   └── src/main/java/eu/urzicroft/turbine/
│       ├── controller/          # REST endpoints (auth, admin, kpi, analytics, meteo, parks, reports, external)
│       ├── service/              # Business logic (KPIs, analytics, reports, users, meteo)
│       ├── security/             # JWT filter/service, per-park access evaluator
│       ├── scheduler/            # Pipeline trigger (5 min) + TSO report job (09:00)
│       ├── repository/           # Spring Data JPA repositories
│       └── model / dto / config
├── data_pipeline/               # Python ETL
│   ├── main.py                   # Entry point: metadata refresh + chunked ETL for meteo & park data
│   └── src/
│       ├── extract.py             # S3 reads (parquet), incremental bookmarking against the DB
│       ├── transform.py           # DQ rules, wind-speed fallback merge, 15-min resampling, audit log
│       └── config.py              # S3 / DB connection settings (via .env)
├── front_end/map/                # React 19 + Vite operations dashboard
│   └── src/                       # Map, LiveChart, ParkDashboard, FaultySensorsTerminal, auth modals
└── images/
```

## 5. Data Pipeline (Track A)

**Sources** (see [`DataDictionary.md`](./DataDictionary.md) for the full schema): parquet files in S3 under `hackathon_meteo_data/`, `hackathon_park_data/`, and `hackathon_wtg_data/`. Sensor tags follow a `PARK_ID.TURBINE_ID.sensor_type` naming convention (e.g. `WP98FA99B8.TID374A8025.act_pwt`).

**ETL flow** (`data_pipeline/src`):

1. **Extract** — turbine metadata is refreshed in full on every run; sensor and meteo parquet files are listed and diffed against an `etl_audit_log` table so already-processed files are skipped (idempotent, incremental loads). New files are processed concurrently with a thread pool.
2. **Wind-speed fallback** — when a turbine's own wind-speed sensor is null, the pipeline merges in the matching external meteo reading for that turbine/timestamp before quality-checking it.
3. **Data quality rules** — readings are rejected (and logged to `rejected_readings` / `rejected_meteo` with a reason) when they show:
   - Whole-number sensor values (the known "integer error" fault signature)
   - Wind speed outside a physically plausible range
   - Component temperature outside a plausible range
   - Negative active power, or active power ≤ 80 while wind speed is > 6 (production/weather discrepancy — a possible fault or unreported stop)
   - Meteo wind speed that's negative, above 150, or missing
4. **Resample & load** — clean readings are grouped by park/turbine/sensor and resampled into 15-minute averages before being appended to `sensor_readings` / `meteo_readings`, ready for the near-real-time graph.

**Tech:** Python, pandas, awswrangler/boto3 (S3 parquet), SQLAlchemy + psycopg2 (PostgreSQL).

## 6. Backend API (Track B)

**Tech:** Java 25, Spring Boot 4, Spring Security (JWT, stateless), Spring Data JPA, PostgreSQL, Caffeine cache, springdoc-openapi (Swagger UI), Gradle.

### Authentication & multi-tenancy

- `POST /api/v1/auth/login` issues a JWT carrying the user's role.
- Roles are scoped per park (`PARK_<parkId>`) or `ADMIN`; a custom `@parkSecurity` method-security evaluator checks on every request whether the caller's role grants access to the requested park or turbine — so one tenant can never see another park's data.
- A dedicated `EXTERNAL_CLIENT` role gates the external-facing API.

### Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Authenticate, returns a JWT |
| `POST` | `/api/v1/admin/tenants` | ADMIN | Create a new tenant user scoped to a park |
| `GET` | `/api/v1/parks` | Authenticated | List all park IDs |
| `GET` | `/api/v1/parks/locations` | Public | Park locations for the map |
| `GET` | `/api/v1/parks/{parkId}/turbines` | Park tenant / ADMIN | Turbines in a park |
| `GET` | `/api/v1/parks/{parkId}/radius` | Authenticated | Park geographic radius |
| `GET` | `/api/v1/kpi/{turbineId}/history` | Park tenant / ADMIN | Turbine metric history for a time range |
| `GET` | `/api/v1/kpi/history/public` | Public | Global public history (last 10 days) |
| `GET` | `/api/v1/kpi/{parkId}/metrics` | Park tenant / ADMIN | Park-level metrics for a time range |
| `GET` | `/api/v1/meteo/turbines/{turbineId}/wind-speed-fallback` | Park tenant / ADMIN | External meteo wind speed used as fallback |
| `GET` | `/api/v1/analytics/turbines/{turbineId}/faulty-sensors` | Park tenant / ADMIN | Recent faulty readings for a turbine |
| `GET` | `/api/v1/analytics/parks/{parkId}/faulty-sensors` | Park tenant / ADMIN | Faulty readings across a park |
| `GET` | `/api/v1/analytics/turbines/{turbineId}/status` | Park tenant / ADMIN | Weather-vs-production discrepancy check |
| `GET` | `/api/v1/reports/tso` | ADMIN | Download the daily TSO CSV report |
| `GET` | `/api/v1/external/turbines/{turbineId}/active-power` | EXTERNAL_CLIENT | Last-15-minutes average active power — the contract API for external clients |

Interactive API docs are served by springdoc at `/swagger-ui.html` once the backend is running.

### Scheduled jobs

- **Every 5 minutes** — triggers the Python ETL pipeline as a subprocess, keeping the warehouse near-real-time.
- **Daily at 09:00** — generates `TSO_Report_<date>.csv` (date, park, turbine, average active power for the previous day), matching the TSO's operational reporting requirement.

## 7. Frontend (Track B)

**Tech:** React 19, Vite, Leaflet / react-leaflet (map), Recharts (charts).

- **Live map** of parks and turbines with per-park radius overlays.
- **Live charts** of wind speed, temperature, and active power at 15-minute/hourly granularity.
- **Park dashboard** with production and availability KPIs.
- **Faulty-sensor terminal** surfacing data gaps and production/weather discrepancies flagged by the backend.
- **Sign-in and tenant administration modals**, driving the JWT-based, per-park access control described above.
- **Report exporter** to download the TSO-ready CSV.

## 8. Getting Started

### Prerequisites

- Java 25 + Gradle (wrapper included)
- Python 3.11+
- Node.js 20+
- A PostgreSQL instance
- AWS credentials with read access to the hackathon S3 bucket (provided by the organizers — see `DataDictionary.md`)

### 1. Data pipeline

```bash
cd data_pipeline
pip install -r requirements.txt
```

Create a `.env` file with:

```
AWS_KEY_ID=...
AWS_KEY_SECRET=...
AWS_REGION=eu-central-1
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
DB_NAME=...
```

```bash
python main.py
```

### 2. Backend API

```bash
cd backend_api
```

Add the same `DB_*` variables to a `.env` file in `backend_api/` (loaded via `spring-dotenv`), then:

```bash
./gradlew bootRun
```

The API starts on `http://0.0.0.0:6767`. In production, secrets such as the JWT signing key (currently a hardcoded constant for hackathon speed) should be externalized to environment variables.

### 3. Frontend

```bash
cd front_end/map
npm install
npm run dev
```

Update `API_BASE_URL` in `src/App.jsx` if the backend isn't running on the default local address.

## 9. Notes & Known Hackathon Shortcuts

- Built in 24 hours — a few things are intentionally simplified for the demo: the JWT secret is hardcoded rather than externalized, and the pipeline scheduler shells out to a fixed local Python path rather than using a job orchestrator.
- `backend_api/TSO_Report_2026-04-04.csv` is a placeholder sample file used during development, not real turbine output.

## 10. Team

**Team 05 — Art of Dying**, PPC HackITall.

![Team Hyped Coders](./images/irl.jfif)
