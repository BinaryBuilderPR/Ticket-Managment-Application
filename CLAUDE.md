# Project Guidelines & Memory: AI-Powered Ticket Management System

---

## 1. Project Overview

An AI-Powered Student Support Desk that ingests inbound support emails, automatically categorizes tickets into three distinct categories (**General Question**, **Technical Question**, **Refund Request**), detects urgency and emotional distress for human escalation, generates bulleted issue summaries, and drafts personalized responses using a verified Knowledge Base (RAG) with **Human-in-the-Loop** agent review before dispatching.

---

## 2. Technology Stack & Monorepo Structure

* **Workspaces:** Monorepo with workspaces `/packages/core`, `/server`, `/client`.
* **Shared Core (`packages/core` / `@ticket-desk/core`):** Universal Zod validation schemas, data models, and inferred TypeScript types shared across client and server.
* **Backend (`/server`):** Express.js + TypeScript running natively on Bun / Node.
* **Authentication:** Better Auth (`better-auth`) with Prisma PostgreSQL adapter, database sessions, HTTP-only secure cookies, and role-based access control (`Role.ADMIN` / `Role.AGENT`).
* **Database & Vector Search:** PostgreSQL 16+ with `pgvector` managed via Prisma ORM.
* **Frontend (`/client`):** React 18+ + TypeScript + Vite + Tailwind CSS + shadcn/ui + React Hook Form + Zod (`@hookform/resolvers/zod`) + TanStack Query + Axios (`@/lib/api-client`).

---

## 3. Zod Schemas in `@ticket-desk/core`

* **Universal Validation Standard:** All data validation schemas must be defined once in `packages/core/src/schemas/` (e.g. `users.ts`, `tickets.ts`) and exported from `packages/core/src/index.ts`.
* **Single Source of Truth:**
  * Define schemas in `@ticket-desk/core` using Zod.
  * Both `/server` and `/client` import schemas and inferred types directly from `@ticket-desk/core` (e.g., `import { createUserSchema, type CreateUserInput, type UserItem } from '@ticket-desk/core'`).
  * **Never duplicate schemas or validation rules locally in `server` or `client`.**
* **Frontend Form Validation (React Hook Form + Zod):**
  * Use React Hook Form with Zod for all form handling:
    ```tsx
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import { createUserSchema, type CreateUserFormData } from '@ticket-desk/core';

    const form = useForm<CreateUserFormData>({
      resolver: zodResolver(createUserSchema),
      defaultValues: { name: '', email: '', password: '', role: 'AGENT' },
    });
    ```
* **Backend Request Validation:**
  * Validate all request payloads (`req.body`, `req.query`, `req.params`) using `schema.safeParse()`.
  * Return structured `400 Bad Request` with Zod validation error messages on failure.

---

## 4. Frontend Networking & State Management

* **Axios:** Always use `@/lib/api-client` (`withCredentials: true`) for all HTTP communications.
* **TanStack React Query:** Always use `useQuery`, `useMutation`, `useQueryClient` for server state, caching, and cache invalidation.
* **No Raw `window.fetch`:** Do not use raw `window.fetch` in React components.

---

## 5. Component Testing (Vitest & React Testing Library)

* **Framework:** Vitest + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom`.
* **Test Utility:** Always wrap components under test with `renderWithQuery` (`@/test/renderWithQuery` / `@/test/test-utils`).
* **Run Component Tests:**
  ```bash
  npm test -w client
  ```
