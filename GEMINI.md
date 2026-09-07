# Project Memory & Guidelines: AI-Powered Ticket Management System

This file serves as the project memory and system guidelines for Antigravity & Claude when developing and maintaining this codebase.

---

## 1. Project Overview

An AI-Powered Student Support Desk that ingests inbound support emails, automatically categorizes tickets into three distinct categories (**General Question**, **Technical Question**, **Refund Request**), detects urgency and emotional distress for human escalation, generates bulleted issue summaries, and drafts personalized responses using a verified Knowledge Base (RAG) with **Human-in-the-Loop** agent review before dispatching.

---

## 2. Technology Stack

* **Runtime & Package Manager:** **Bun (v1.1+)** / **Node.js** with workspace monorepo (`/server`, `/client`).
* **Backend:** **Express.js** + **TypeScript** running natively on Bun / Node.
* **Authentication:** **Better Auth** (`better-auth`) with Prisma PostgreSQL adapter, database sessions, HTTP-only secure cookies, and role-based access control (`ADMIN` / `AGENT`).
* **Database & Vector Search:** **PostgreSQL 16+** with **`pgvector`** managed via **Prisma ORM**.
* **Frontend:** **React 18+** + **TypeScript** + **Vite** + **Tailwind CSS** + **shadcn/ui** (Slate default theme, Radix UI primitives) + **React Hook Form** + **Zod** + **TipTap Rich Text Editor** + **React Router v6** + **TanStack Query** + **Axios**.
* **AI Engine:** **Anthropic Claude API** (`claude-3-5-haiku` for classification/summaries, `claude-3-5-sonnet` for RAG draft generation).
* **Email Service:** **SendGrid / Mailgun** for inbound webhook parsing and outbound threaded replies.
* **Containerization:** Multi-stage **Docker** (`oven/bun:1-alpine`) & **Docker Compose**.

---

## 3. Documentation & Context Fetching (Context7 MCP)

Always utilize **Context7 MCP** tools to fetch up-to-date documentation, API signatures, and official best practices before implementing new dependencies or patterns:

1. **`resolve-library-id`**: Resolve package names to Context7 library IDs (e.g., `/better-auth/better-auth`, `/prisma/prisma`, `/tailwindlabs/tailwindcss`, `/ueberdosis/tiptap`, `/tanstack/react-query`, `/axios/axios`, `/vitest-dev/vitest`, `/testing-library/react-testing-library`).
2. **`query-docs`**: Query the latest official documentation and verified code snippets.

---

## 4. Development Principles & Behavioral Rules

1. **Step-by-Step Implementation:** Do not write massive monolithic features all at once. Build modularly, test incrementally, and verify each phase with the user.
2. **Strict TypeScript & Type Safety (Zod):**
   * **Always use Zod for Data Validation** across both frontend and backend.
   * **Backend Validation:** Validate all inbound HTTP request bodies, query parameters, and route parameters with Zod schemas before processing in route handlers/controllers.
   * **Frontend Validation:** Validate forms with Zod schemas integrated into **React Hook Form** using `@hookform/resolvers/zod`.
   * **Type Inference:** Derive TypeScript types directly from Zod schemas using `z.infer<typeof schema>` to maintain a single source of truth for types.
3. **Database Sessions & Security:** Keep all authentication state in PostgreSQL database sessions via Better Auth. Never expose session secrets or API keys to the client.
4. **Human-in-the-Loop AI:** The AI drafts replies, but human agents always review, format/beautify, and approve before email dispatching.
5. **Clean Layered Backend Architecture:**
   * `routes/` -> `controllers/` -> `services/` -> `db/prisma`
   * Dedicated error handling middleware and Zod request validation on all endpoints.
6. **Frontend Networking & State Management (Axios & TanStack React Query):**
   * **Always use Axios** (via `@/lib/api-client` configured with `withCredentials: true`) for all HTTP communications with the backend API.
   * **Always use TanStack React Query** (`useQuery`, `useMutation`, `useQueryClient`) for server state management, caching, background synchronization, loading/error states, and automated query invalidation.
   * **Do NOT use raw `window.fetch`** in frontend React components.

---

## 5. Quick Reference Commands

```bash
# Start PostgreSQL container (with pgvector)
docker compose up -d

# Install dependencies across monorepo
bun install # or npm install

# Start Express Backend (http://localhost:5000)
cd server && npm start # or bun run dev:server

# Start React Frontend (http://localhost:5173)
cd client && npm run dev # or bun run dev:client

# Prisma Database Migrations & Seeds
npx prisma migrate dev
npx prisma db seed # or npm run seed

# Seed Credentials
# Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD etc. in server/.env before seeding
# Never use weak or default passwords — see server/.env.example for guidance
```

---

## 6. E2E Testing & Test Writer Agent

* **Framework:** Playwright (config at root `playwright.config.ts`)
* **Test database:** `helpdesk_test` (isolated from dev `helpdesk` DB), configured in `server/.env.test`
* **Ports:** Test server on 3001, test client on 5174 (dev uses 5000/5173)
* **Global setup (`e2e/global-setup.ts`):** Runs database setup and seeds the test DB
* **Tests directory:** `e2e/tests/`
* **Outputs:** `e2e/test-results/` and `e2e/playwright-report/`
* **Run tests:** `bun run test:e2e` from root (also `test:e2e:ui`, `test:e2e:headed`)
* **E2E Test Writer Agent:**
  To generate or update Playwright test specs under `e2e/tests/`, invoke the custom test writer agent:
  `/agent @[.agents/playwright-test-writer.md]`

---

## 7. Frontend Component Testing (Vitest & React Testing Library)

* **Framework:** **Vitest** + **`@testing-library/react`** + **`@testing-library/jest-dom`** + **`@testing-library/user-event`** + **`jsdom`**.
* **Configuration:** Inline under `client/vite.config.ts` (`test: { globals: true, environment: 'jsdom', setupFiles: './src/test/setup.ts' }`).
* **Test Utilities & Wrappers:** Always wrap components under test using `renderWithQuery` from `@/test/renderWithQuery` (or `@/test/test-utils`), which provides:
  * Isolated `QueryClient` with `retry: false`, `gcTime: 0`, and `staleTime: 0`.
  * `BrowserRouter` for routing support.
* **API Mocking:** Mock Axios calls via `vi.spyOn(apiClient, 'get')` and `vi.spyOn(apiClient, 'post')`. For error responses, mock with `new AxiosError(...)`.
* **Required Coverage Checklist for Component Tests:**
  1. **Loading State:** Verify skeleton loaders or loading indicators render while queries are pending.
  2. **Data Rendering:** Verify tables/lists render items, badges, formatted dates, and data cells correctly.
  3. **Empty State:** Verify fallback/empty placeholder messages render when empty lists are returned.
  4. **Error Handling & Retry:** Verify error banners display with working "Try Again" retry triggers.
  5. **Modal & Dialog Lifecycles:** Verify open, close, and cancel actions.
  6. **Form Validation:** Verify client-side Zod validation errors on empty or invalid inputs.
  7. **Mutations Flow:** Verify payload submission, loading button state, success feedback, and automated query cache invalidation.
  8. **Server Error Feedback:** Verify backend validation/conflict errors (e.g. 409 email exists) display inside modals.
* **Run Component Tests:**

  ```bash
  # Single run
  npm test -w client

  # Run with verbose output and logs
  npm test -w client -- --reporter=verbose

  # Interactive watch mode
  npm run test:client:watch

  # Interactive Vitest visual UI dashboard
  cd client && npx vitest --ui
  ```

---

## 8. Zod Data Validation & Schema Integrity

* **Universal Validation Standard:** Use **Zod** as the sole schema definition and runtime validator across the entire monorepo.
* **Shared Core Package (`packages/core`):**
  * **Always define Zod schemas in `packages/core/src/schemas/`** (e.g. `users.ts`, `tickets.ts`) and export from `packages/core/src/index.ts`.
  * **Reference in Client & Server:** Both `/server` and `/client` import schemas and inferred types directly from `@ticket-desk/core` (e.g. `import { createUserSchema, type CreateUserInput } from '@ticket-desk/core'`).
  * Never duplicate schemas or interfaces locally in `server` or `client`.
* **Frontend Form Validation (React Hook Form + Zod):**
  * **Always use React Hook Form with Zod** for all form handling (e.g. adding new users, ticket replies, settings):
    * Import schemas from `@ticket-desk/core` (`createUserSchema`).
    * Integrate with React Hook Form using `useForm<CreateUserFormData>({ resolver: zodResolver(createUserSchema), defaultValues: { ... } })`.
    * Wire up inputs with `{...register('fieldName')}` and display real-time client-side error feedback via `errors.fieldName?.message`.
    * Handle submission via TanStack Query's `useMutation` in the `handleSubmit(onSubmit)` handler.
  * Always test form validation rules in component tests (e.g. verifying empty fields, invalid emails, length constraints, and error messages).
* **Backend Request Validation:**
  * Validate all request payloads (`req.body`, `req.query`, `req.params`) using `schema.safeParse()`.
  * Return structured `400 Bad Request` responses containing Zod validation error messages when validation fails.
* **Type Safety & Single Source of Truth:**
  * Infer TypeScript types using `type UserFormData = z.infer<typeof createUserSchema>;`. Never maintain duplicate TypeScript interfaces for validated models.
  * **Prisma Enums for Validation & RBAC:** Always import and utilize database enums generated by Prisma (e.g. `import { Role } from '@prisma/client'`). Use `z.nativeEnum(Role)` in Zod schemas (e.g. `role: z.nativeEnum(Role).default(Role.AGENT)`) and pass `Role.ADMIN` / `Role.AGENT` into RBAC middlewares rather than hardcoded string literals.

