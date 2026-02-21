# EpiTrace

EpiTrace is an incident monitoring and remediation backend designed for "Cline CLI as Infrastructure" workflows.

It continuously checks your monitored endpoints, analyzes failures with Cline, sends actionable alerts, and can launch a second Cline job to create a real GitHub PR with an automated fix.

## Links

- Frontend (deployed): https://epi-trace-frontend.vercel.app/
- Frontend repository: https://github.com/Shahidul-Khan2004/EpiTrace-Frontend

## What This Project Does

- Monitors HTTP endpoints on a schedule (per monitor)
- Detects downtime and response failures
- Runs AI-powered incident analysis using Cline
- Sends structured alerts to Slack/Discord
- Creates one-click auto-fix trigger links in alerts
- Runs a code-fix Cline job that:
  - clones the target repository
  - applies a real fix
  - runs tests when available
  - pushes a branch
  - opens a GitHub PR
- Streams live code-worker logs over SSE

## Architecture

```text
                    +-----------------------------+
                    |        EpiTrace API         |
                    |  (Express + Postgres + JWT) |
                    +--------------+--------------+
                                   |
                                   | enqueue monitor jobs
                                   v
                    +-----------------------------+
                    |   analysis-requests queue   |
                    |          (BullMQ)           |
                    +--------------+--------------+
                                   |
                                   | check endpoint
                                   v
                    +-----------------------------+
                    |       analysisWorker        |
                    |  stores checks in Postgres  |
                    +--------------+--------------+
                                   |
                                   | if DOWN
                                   v
                    +-----------------------------+
                    |    down-monitors queue      |
                    +--------------+--------------+
                                   |
                                   v
                    +-----------------------------+
                    | vmServer down worker        |
                    | runs run-cline-job.sh       |
                    | sends analysis -> /alert    |
                    +--------------+--------------+
                                   |
                                   | Slack/Discord alert + trigger link
                                   v
                    +-----------------------------+
                    | /alert/trigger-agent        |
                    | enqueues code_queue job     |
                    +--------------+--------------+
                                   |
                                   v
                    +-----------------------------+
                    | vmServer code worker        |
                    | runs cline-code-job.sh      |
                    | creates commit/PR           |
                    +-----------------------------+
```

## Repository Layout

```text
.
├── server/            # Main API, auth, monitors, queues, alerts, log stream
├── vmServer/          # Cline execution workers (analysis + code-fix)
├── winners/           # Imported hackathon winner references
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL
- Redis
- `cline` CLI available in PATH
- Git and GitHub CLI (`gh`) for auto-fix PR flow

### 1. Install Dependencies

```bash
npm install
cd server && npm install
cd ../vmServer && npm install
cd ..
```

### 2. Configure Environment

Copy the templates and fill values:

```bash
cp server/.env.example server/.env
cp vmServer/.env.example vmServer/.env
```

### 3. Start Services

Run each process in a separate terminal:

```bash
# Terminal 1: API
cd server
npm run dev
```

```bash
# Terminal 2: Monitoring worker
cd server
npm run worker:analysis
```

```bash
# Terminal 3: Down-monitor Cline analysis worker
cd vmServer
npm run dev
```

```bash
# Terminal 4: Cline code-fix worker
cd vmServer
npm run worker:code
```

## Core Workflow

1. Create user and login (`/auth/register`, `/auth/login`)
2. Create monitor (`/monitor/create`) with target URL and repo URL
3. Start monitor (`/monitor/start/:id`)
4. If endpoint goes down, system:
   - stores DOWN check
   - enqueues `down-monitors` job
   - runs Cline analysis
   - sends Slack/Discord alert with analysis and trigger link
5. Click trigger link (`/alert/trigger-agent?jobId=...`) to start code-fix job
6. Code worker runs Cline, verifies tests, pushes branch, opens PR

## API Surface

Swagger UI:

- `GET /docs`
- `GET /api-docs`

Main route groups:

- Public:
  - `/health`
  - `/dev/reset-db` (dangerous, dev only)
  - `/auth/*`
  - `/alert/*`
  - `/logs/*`
- Auth required (Bearer token):
  - `/monitor/*`
  - `/webhook/*`
  - `/github-token/*`

Detailed endpoint reference: `docs/API.md`.

## Live Log Streaming

The code worker posts structured logs to:

- `POST /logs/code-worker`

Clients can subscribe via SSE:

- `GET /logs/code-worker/stream`
- Optional filter: `?jobId=<id>`

Operational details: `docs/OPERATIONS.md`.

## Environment Variables

See:

- `server/.env.example`
- `vmServer/.env.example`

## Notes

- Queue and worker names are part of the contract:
  - `analysis-requests`
  - `down-monitors`
  - `code_queue`
- Cline auto-fix requires valid GitHub token association for monitor.
- `GET /dev/reset-db` truncates all public tables; do not expose in production.

## License

- [LICENSE](LICENSE)

