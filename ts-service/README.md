# TalentFlow TypeScript Service

NestJS + TypeORM service implementing the candidate document and AI-powered summarization workflow for the TalentFlow backend assessment.

## What This Service Does

This service exposes a workspace-scoped REST API for uploading candidate documents (résumés, cover letters, etc.) and triggering asynchronous AI summarization via Google Gemini. Summaries are generated in the background through a polling worker that reads queued jobs, calls the LLM, and persists structured results back to the database.

## Prerequisites

- Node.js 22+
- npm
- PostgreSQL (start via Docker from repository root):

```bash
docker compose up -d postgres
```

## Setup

```bash
cd ts-service
npm install
cp .env.example .env
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `PORT` | Port to bind the server to (default: `3000`) |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/talentflow` |
| `NODE_ENV` | Runtime environment: `development`, `test`, or `production` |
| `GEMINI_API_KEY` | Google Gemini API key for live summarization. Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey). **If not set, or when `NODE_ENV=test`, the fake provider is used automatically.** |

> Do not commit `.env` or any API keys to version control.

## Run Migrations

```bash
cd ts-service
npm run migration:run
```

To roll back:

```bash
npm run migration:revert
```

## Run the Service

```bash
cd ts-service
npm run start:dev
```

Interactive API docs (Swagger) are available at [http://localhost:3000/api](http://localhost:3000/api) once the server is running.

## Run Tests

Unit tests (no database, no Gemini API required):

```bash
cd ts-service
npm test
```

End-to-end tests:

```bash
npm run test:e2e
```

Run a specific spec file:

```bash
npx jest src/sample/sample.service.spec.ts --no-coverage
```

## Auth Headers

All `/candidates` endpoints are protected by a fake local auth guard. Include these headers on every request:

| Header | Description |
|---|---|
| `x-user-id` | Any non-empty string (e.g. `user-1`) |
| `x-workspace-id` | Workspace identifier used for data scoping (e.g. `workspace-1`) |

All candidate documents and summaries are scoped to the workspace from the header — cross-workspace access returns `403 Forbidden`.

## API Endpoints

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/health` | `200` | Health check |
| `POST` | `/candidates/:candidateId/documents` | `201` | Upload a candidate document (stored as local text file) |
| `POST` | `/candidates/:candidateId/summaries/generate` | `202` | Enqueue an AI summarization job (returns immediately) |
| `GET` | `/candidates/:candidateId/summaries` | `200` | List all summaries for a candidate |
| `GET` | `/candidates/:candidateId/summaries/:summaryId` | `200` | Fetch a single summary by ID |

### Document Upload — Request Body

```json
{
  "candidateId": "abc-123",
  "documentType": "resume",
  "fileName": "resume.txt",
  "rawText": "Experienced software engineer with 5 years..."
}
```

### Generate Summary — Request Body

```json
{
  "documentId": "doc-uuid",
  "llmModel": "gemini-2.5-flash"
}
```

## Async Summarization Flow

1. `POST /summaries/generate` creates a `candidate_summaries` row with an empty `summary` and transitions the document status to `processing`, then enqueues a job.
2. The `SummarizationWorker` polls the in-memory queue every **5 seconds**.
3. The worker reads the raw document text from local `.storage/`, calls the LLM provider, validates the structured response, and saves the result back to `candidate_summaries`.
4. The document `status` transitions to `completed` on success or `failed` on error.

**Document status lifecycle:** `pending` → `processing` → `completed` | `failed`

## Project Layout

```
ts-service/
├── src/
│   ├── main.ts                          # NestJS bootstrap, global pipes, Swagger setup
│   ├── app.module.ts                    # Root module — wires all feature modules
│   ├── auth/
│   │   ├── fake-auth.guard.ts           # Reads x-user-id / x-workspace-id headers
│   │   ├── workspace-access.guard.ts    # Validates candidate belongs to request workspace
│   │   ├── auth-user.decorator.ts       # @CurrentUser() param decorator
│   │   └── auth.types.ts               # AuthUser interface
│   ├── entities/
│   │   ├── candidate-document.entity.ts # candidate_documents table (id, candidateId, storageKey, status, …)
│   │   ├── candidate-summary.entity.ts  # candidate_summaries table (id, documentId, summary, llmModel, …)
│   │   ├── sample-candidate.entity.ts   # Starter: sample_candidates table
│   │   └── sample-workspace.entity.ts   # Starter: sample_workspaces table
│   ├── llm/
│   │   ├── summarization-provider.interface.ts  # SummarizationProvider interface + token + types
│   │   ├── gemini-summarization.provider.ts     # Real Gemini implementation with structured output + validation
│   │   ├── fake-summarization.provider.ts       # Deterministic fake for tests (no API key needed)
│   │   └── llm.module.ts                        # Dynamic provider selection (Gemini vs Fake based on env)
│   ├── queue/
│   │   ├── queue.service.ts             # In-memory job queue (enqueue / getQueuedJobs)
│   │   └── queue.module.ts
│   ├── migrations/
│   │   ├── 1710000000000-InitialStarterEntities.ts   # sample_candidates, sample_workspaces
│   │   └── 1710000000001-CandidateDocumentsAndSummaries.ts  # candidate_documents, candidate_summaries + indexes + FK
│   ├── sample/
│   │   ├── candidates.controller.ts     # Route handlers for /candidates (thin — delegates to SampleService)
│   │   ├── sample.service.ts            # All business logic: create docs, enqueue summaries, list/get summaries
│   │   ├── summarization.worker.ts      # Background polling worker — dequeues jobs, calls LLM, updates DB
│   │   ├── sample.module.ts
│   │   ├── sample.service.spec.ts       # Unit tests for all service methods (mock repos, no DB/API)
│   │   └── dto/
│   │       ├── create-candidate-document.dto.ts  # Validates document upload payload
│   │       ├── generate-candidate-summary.dto.ts # Validates summarization request
│   │       └── create-sample-candidate.dto.ts    # Starter DTO
│   ├── config/
│   │   ├── typeorm.config.ts            # TypeORM DataSource for CLI (migrations)
│   │   └── typeorm.options.ts           # TypeORM options factory for NestJS module
│   ├── common/
│   │   ├── guards/                      # Shared guard utilities
│   │   ├── decorators/                  # Shared decorators
│   │   └── interfaces/                  # Shared interfaces
│   └── health/
│       ├── health.controller.ts         # GET /health
│       └── health.module.ts
├── test/
│   └── app.e2e-spec.ts                  # End-to-end test
├── .storage/                            # Local file storage for uploaded document text
├── package.json
├── jest.config.ts
├── tsconfig.json
├── .env.example
└── NOTES.md                             # Design decisions and future improvements
```
