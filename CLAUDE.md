# TeamTrack — Claude Code Guide

## Project Overview

**TeamTrack** is a collaborative task management application.
- **Repo:** `github.com/critiq17/team-track`
- **Branch model:** `dev` → feature branches → PR to `main`
- **Git identity:** `critiq17 <critiq17@gmail.com>` — ALL commits use this identity

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend language | Go 1.24 |
| Backend framework | Fiber v2 |
| ORM | GORM v2 |
| Database | PostgreSQL 16 |
| Auth | JWT (golang-jwt/jwt/v5) + Argon2id |
| Logger | Zap (go.uber.org/zap) |
| API docs | Swagger (swaggo) |
| Monitoring | Sentry (backend + frontend) |
| Frontend framework | React 19 |
| Frontend language | TypeScript (strict) |
| Routing | React Router DOM v7 |
| HTTP client | Axios |
| Rich text | BlockNote v0.47 |
| Drag & Drop | @dnd-kit |
| Motion | Framer Motion |
| Bundler | Vite |
| Infrastructure | Docker Compose |

---

## Architecture

### Backend: Domain-Driven Design (DDD)

```
backend/internal/
├── domain/        ← PURE: entities, value objects, repo interfaces, domain errors
│   ├── auth/
│   ├── entity/    ← Shared base entity types
│   ├── folder/
│   ├── password/
│   ├── passwordaudit/
│   ├── passwordreset/
│   ├── task/      ← Core domain (tasks are the product)
│   ├── team/
│   ├── user/
│   └── verification/
├── app/           ← Use cases (orchestrate domain + infra)
├── api/           ← Fiber HTTP handlers (thin, no business logic)
├── repository/    ← GORM implementations of domain repo interfaces
├── service/       ← External service implementations
├── infra/         ← Other infrastructure adapters
├── security/      ← JWT middleware, password helpers
├── config/        ← Config loading from env
├── db/            ← DB connection, migrations runner
├── logger/        ← Zap logger factory
├── events/        ← Domain event bus
├── notifications/ ← Email/notification
└── storage/       ← File/blob storage
```

**DDD Layer Rule:** `api → app → domain ← repository`
- `domain` imports NOTHING from other internal layers
- `api` handlers call `app` use cases only
- `repository` implements `domain` interfaces

### Frontend: Feature-Slice Design (FSD)

```
react-frontend/src/
├── app/       ← Root: providers, router setup
├── pages/     ← Route pages (thin wrappers)
├── widgets/   ← Composed sections (reused across pages)
├── features/  ← Feature slices (user interactions)
│   └── auth/  ← Auth feature
├── entities/  ← Business entity UI models
├── shared/    ← Reusable: UI kit, API client, utils, types
├── hooks/     ← App-wide custom hooks
├── services/  ← API service functions (one per domain)
├── contexts/  ← React contexts
└── types/     ← TypeScript type definitions
```

**FSD Import Rule:** `pages → widgets → features → entities → shared`
Never import upward (features cannot import from pages/widgets).

---

## Agent Team

Use these agents for every task. Always delegate to the right specialist.

### Quick Reference

| Agent | Command | Use When |
|-------|---------|----------|
| **team-lead** | Orchestrate full feature | New feature, complex task, anything cross-cutting |
| **backend-developer** | Implement Go code | Backend feature, API endpoint, domain logic |
| **frontend-developer** | Implement React code | UI feature, component, hook, service |
| **go-reviewer** | Review Go code | After ANY backend code is written |
| **react-reviewer** | Review React/TS code | After ANY frontend code is written |
| **tester** | Write tests | After implementation, or TDD-first |
| **infra-developer** | Infrastructure work | End of feature, migrations, Docker, CI/CD |
| **git-agent** | Commit & push | After task complete and reviewed |

### Standard Feature Workflow

```
1. team-lead      → Break down into tasks, identify layers affected
2. backend-developer → Implement backend (domain → app → api → repository)
3. frontend-developer → Implement frontend (service → hook → component → page)
   [2 & 3 can run in parallel if independent]
4. tester         → Write tests for backend and frontend
5. go-reviewer    → Review backend code
6. react-reviewer → Review frontend code
   [5 & 6 can run in parallel]
7. infra-developer → Validate infra, add migrations if needed
8. git-agent      → Commit with [STEP N] convention
```

### Parallel Execution

When tasks are independent, launch agents in parallel:
```
Parallel block 1: backend-developer + frontend-developer
Parallel block 2: go-reviewer + react-reviewer
```

---

## Fast Navigation

### Key Files

| Purpose | Path |
|---------|------|
| Backend entry point | `backend/cmd/main.go` |
| Route registration | `backend/internal/api/` |
| Domain entities | `backend/internal/domain/` |
| Use cases | `backend/internal/app/` |
| DB migrations | `backend/migrations/` |
| Frontend entry | `react-frontend/src/main.tsx` |
| React Router | `react-frontend/src/app/App.tsx` |
| API services | `react-frontend/src/services/` |
| Feature slices | `react-frontend/src/features/` |
| Shared UI components | `react-frontend/src/shared/` |
| Docker setup | `docker-compose.yaml` |
| Backend Makefile | `backend/Makefile` |

### Common Commands

```bash
# Start everything
docker-compose up -d

# Backend dev
cd backend && go run ./cmd/...
cd backend && go test ./...
cd backend && make migrate-up

# Frontend dev
cd react-frontend && npm run dev
cd react-frontend && npm run build
cd react-frontend && npm run type-check

# Check git status
git log --oneline -10
git status
```

### Finding Code Fast

```bash
# Find handler for a specific route
grep -r "app.Post\|app.Get\|app.Put\|app.Delete" backend/internal/api/

# Find a domain entity
ls backend/internal/domain/

# Find a feature slice
ls react-frontend/src/features/

# Find all API service calls
grep -r "taskService\|userService\|teamService" react-frontend/src/
```

---

## Coding Standards Summary

### Backend (Go)
- Errors ALWAYS wrapped: `fmt.Errorf("context: %w", err)`
- `context.Context` is first parameter always
- GORM: always use `.WithContext(ctx)`
- No business logic in Fiber handlers
- Max 400 lines per file, 50 lines per function
- Swagger annotations on all endpoints

### Frontend (React/TS)
- No `any` types
- FSD layer boundaries strictly enforced
- `useEffect` always has cleanup for async/subscriptions
- All states handled: loading, error, empty
- Max 300 lines per component file

### Git
- Identity: `critiq17 <critiq17@gmail.com>` — never Claude
- Format: `<type>([STEP N]): <description>`
- Current step: check `git log --oneline -3`
- Branch: work on `dev`, PR to `main`

---

## Quality Gates

Before any commit:
1. Go tests pass: `cd backend && go test ./...`
2. TypeScript check: `cd react-frontend && npm run type-check`
3. No hardcoded secrets
4. go-reviewer or react-reviewer approved
5. tester confirmed coverage ≥ 80%
6. infra-developer validated (for infra changes)

---

## Domain Quick Map

| Domain | Entities | Key Operations |
|--------|----------|----------------|
| task | Task, TaskStatus, Priority | Create, assign, update status, filter |
| user | User, Profile | Register, login, update profile |
| team | Team, Member, Role | Create team, invite, manage members |
| folder | Folder | Organize tasks into folders |
| auth | Token, Session | Login, logout, refresh token |
| password | Password | Reset, change, audit trail |
| verification | VerificationToken | Email verification |
