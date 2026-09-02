# Project Memory & Guidelines: AI-Powered Ticket Management System

This file serves as the project memory and system guidelines for Antigravity when developing and maintaining this codebase.

---

## 1. Project Overview

An AI-Powered Student Support Desk that ingests inbound support emails, automatically categorizes tickets into three distinct categories (**General Question**, **Technical Question**, **Refund Request**), detects urgency and emotional distress for human escalation, generates bulleted issue summaries, and drafts personalized responses using a verified Knowledge Base (RAG) with **Human-in-the-Loop** agent review before dispatching.

---

## 2. Technology Stack

* **Runtime & Package Manager:** **Bun (v1.1+)** / **Node.js** with workspace monorepo (`/server`, `/client`).
* **Backend:** **Express.js** + **TypeScript** running natively on Bun / Node.
* **Authentication:** **Better Auth** (`better-auth`) with Prisma PostgreSQL adapter, database sessions, HTTP-only secure cookies, and role-based access control (`ADMIN` / `AGENT`).
* **Database & Vector Search:** **PostgreSQL 16+** with **`pgvector`** managed via **Prisma ORM**.
* **Frontend:** **React 18+** + **TypeScript** + **Vite** + **Tailwind CSS** + **shadcn/ui** (Slate default theme, Radix UI primitives) + **React Hook Form** + **Zod** + **TipTap Rich Text Editor** + **React Router v6** + **TanStack Query**.
* **AI Engine:** **Anthropic Claude API** (`claude-3-5-haiku` for classification/summaries, `claude-3-5-sonnet` for RAG draft generation).
* **Email Service:** **SendGrid / Mailgun** for inbound webhook parsing and outbound threaded replies.
* **Containerization:** Multi-stage **Docker** (`oven/bun:1-alpine`) & **Docker Compose**.

---

## 3. Documentation & Context Fetching (Context7 MCP)

Always utilize **Context7 MCP** tools to fetch up-to-date documentation, API signatures, and official best practices before implementing new dependencies or patterns:

1. **`resolve-library-id`**: Resolve package names to Context7 library IDs (e.g., `/better-auth/better-auth`, `/prisma/prisma`, `/tailwindlabs/tailwindcss`, `/ueberdosis/tiptap`).
2. **`query-docs`**: Query the latest official documentation and verified code snippets.

---

## 4. Development Principles & Behavioral Rules

1. **Step-by-Step Implementation:** Do not write massive monolithic features all at once. Build modularly, test incrementally, and verify each phase with the user.
2. **Strict TypeScript & Type Safety:** Ensure strict typing across API request/response payloads (using `Zod` validation).
3. **Database Sessions & Security:** Keep all authentication state in PostgreSQL database sessions via Better Auth. Never expose session secrets or API keys to the client.
4. **Human-in-the-Loop AI:** The AI drafts replies, but human agents always review, format/beautify, and approve before email dispatching.
5. **Clean Layered Backend Architecture:**
   * `routes/` -> `controllers/` -> `services/` -> `db/prisma`
   * Dedicated error handling middleware and Zod request validation on all endpoints.

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

## 6. E2E Testing

* **Framework:** Playwright (config at root `playwright.config.ts`)
* **Test database:** `helpdesk_test` (isolated from dev `helpdesk` DB), configured in `server/.env.test`
* **Ports:** Test server on 3001, test client on 5174 (dev uses 5000/5173)
* **Global setup (`e2e/global-setup.ts`):** Runs database setup and seeds the test DB
* **Tests directory:** `e2e/tests/`
* **Run tests:** `bun run test:e2e` from root (also `test:e2e:ui`, `test:e2e:headed`)
