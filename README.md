# Node Express Mongo Starter

Production-grade **Node.js 22 + Express 5 + TypeScript + MongoDB Atlas** API boilerplate.
Clone it for every new project, then start writing business logic.

**What's included:** strict TypeScript · feature-based modules · Zod validation · central error
handling · standard response envelope · Pino logs with request IDs · Helmet / CORS / rate
limiting / NoSQL-injection protection · optional JWT login with refresh-token rotation ·
Swagger docs from Zod · Vitest + Supertest with in-memory MongoDB · Docker · GitHub Actions CI ·
ESLint / Prettier / Husky / Commitlint · module generator.

---

## 1. Quick start (5 minutes)

```bash
git clone <this-repo> my-new-api
cd my-new-api
rm -rf .git && git init          # start fresh history for the new project
npm install                      # creates package-lock.json → commit it
cp .env.example .env             # then edit .env (see "MongoDB Atlas setup")
npm run format && npm run lint   # one-time: normalizes formatting
npm run seed:admin               # only if you use the auth module
npm run dev
```

- API: `http://localhost:4000/api/v1`
- Docs: `http://localhost:4000/docs`
- Health: `http://localhost:4000/health/ready`

## 2. MongoDB Atlas setup

1. **Create a cluster** (M0 Free is fine for development).
2. **Database Access** → add a database user with _Read and write to any database_
   (production: restrict to one database).
3. **Network Access** → add your current IP. In production, add only the server's
   outbound IP; avoid `0.0.0.0/0`.
4. **Connect → Drivers** → copy the connection string into `MONGODB_URI`.
5. Set `MONGODB_DB_NAME` per environment: `myapp_dev`, `myapp_staging`, `myapp_prod`.
   Use a separate cluster for production when possible.

Atlas always runs a **replica set**, so transactions (`withTransaction`) work on every tier.
Tests never touch Atlas. They use an in-memory MongoDB replica set.

## 3. Scripts

| Script                               | What it does                                            |
| ------------------------------------ | ------------------------------------------------------- |
| `npm run dev`                        | Start with hot reload (tsx watch)                       |
| `npm run build` / `npm start`        | Compile to `dist/` / run the compiled app               |
| `npm test` / `npm run test:coverage` | Run tests / with coverage                               |
| `npm run lint` / `npm run format`    | ESLint / Prettier                                       |
| `npm run typecheck`                  | TypeScript check without emitting                       |
| `npm run make:module <name>`         | Generate a full CRUD module (e.g. `order`, `blog-post`) |
| `npm run seed:admin`                 | Create the first admin user (auth module)               |
| `npm run remove:auth`                | Delete the auth module for CRUD-only projects           |

## 4. Folder structure

```
src/
├── config/env.ts            # Zod-validated env (app refuses to start if invalid)
├── core/                    # framework layer, shared by every module
│   ├── database/            # Atlas connection (retry), transactions, shared schema options
│   ├── errors/              # AppError + NotFoundError, ConflictError, ...
│   ├── health/              # /health/live and /health/ready
│   ├── logger/              # pino logger
│   ├── middlewares/         # error handler, validate, rate limiter, sanitize, http logger
│   ├── types/               # AppModule contract
│   └── utils/               # response helpers, pagination, zod (with openapi), ...
├── docs/                    # OpenAPI document builder + helpers
├── modules/                 # 👉 your business features live here
│   ├── index.ts             # the ONLY place modules are registered
│   ├── auth/                # optional: login, refresh, logout, me, roles
│   └── products/            # example CRUD module (copy this pattern)
├── routes/index.ts          # mounts all modules under API_PREFIX
├── app.ts                   # builds the Express app (no listen → testable)
└── server.ts                # connects DB, starts server, graceful shutdown
tests/                       # global test setup + cross-cutting tests
scripts/                     # make-module, seed-admin, remove-auth (+ templates)
```

### Request flow inside a module

```
Route → validate(Zod) → Controller → Service → Repository → Mongoose Model
```

| Layer             | Does                                      | Never does                 |
| ----------------- | ----------------------------------------- | -------------------------- |
| `*.routes.ts`     | URL + middleware wiring                   | logic                      |
| `*.schema.ts`     | Zod validation + types                    | —                          |
| `*.controller.ts` | read request, call service, send response | DB queries, business rules |
| `*.service.ts`    | business rules, throws `AppError`s        | touch `req` / `res`        |
| `*.repository.ts` | all DB queries                            | business decisions         |
| `*.model.ts`      | Mongoose schema + indexes                 | —                          |
| `*.docs.ts`       | Swagger docs from the same Zod schemas    | —                          |

## 5. API conventions

Success response:

```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

Error response (same shape for every error):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "location": "body", "path": "price", "message": "Number must be >= 0" }],
    "requestId": "7f1c..."
  }
}
```

- Throw errors anywhere: `throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND')`.
- No `try/catch` is needed in controllers. Express 5 forwards async errors.
- Every response has an `x-request-id` header; search logs by it.
- Lists support `?page=1&limit=20&sort=-createdAt&search=...`.

## 6. Adding a feature

```bash
npm run make:module order
```

This creates `src/modules/orders/` with all 8 layer files plus a test, registers it in
`src/modules/index.ts`, and serves it at `/api/v1/orders` with Swagger docs. Then edit the model
and schema to add your real fields.

## 7. Auth module (optional)

Endpoints: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.

- The access token is a JWT that lives 15 minutes and is sent as `Authorization: Bearer <token>`.
- The refresh token is a random 7-day token, stored only as a SHA-256 hash. It is **rotated** on
  every refresh. Reusing an old one revokes all of that user's sessions (stolen-token detection).
- There is no public register endpoint. Create users with `npm run seed:admin` or your own admin
  module.

Protect any route:

```ts
import { authenticate, authorize } from '@/modules/auth';

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createBody }),
  controller.create,
);
```

> ⚠️ The example `products` routes are public. Add `authenticate` to them when you keep auth.

**CRUD-only project?** Run `npm run remove:auth && npm install`. It removes the module, its env
variables, its scripts and its dependencies.

## 8. Docker (optional — for deployment)

MongoDB is not in Docker; the container connects to Atlas.

```bash
docker compose up --build        # runs the production image locally using .env
```

The `Dockerfile` is multi-stage: it compiles TypeScript, then ships only `dist/` and production
dependencies in a small image that runs as a non-root user. It needs a committed
`package-lock.json`.

## 9. Production checklist

- `NODE_ENV=production`, a real `JWT_ACCESS_SECRET` (the app refuses the example value)
- `CORS_ORIGINS` set to real frontend domains, never `*`
- `TRUST_PROXY=1` behind Render / Railway / Nginx (correct client IPs for rate limiting)
- `DOCS_ENABLED=false` if the API is private
- Atlas: production cluster, IP allow-list, per-app DB user, backups on
- Running more than one instance? Use a Redis store for the rate limiter

## 10. Git conventions

Commits follow **Conventional Commits** (enforced by commitlint):
`feat: add orders module`, `fix: handle expired token`, `chore: bump deps`.
Before each commit, Husky runs ESLint and Prettier on staged files.
