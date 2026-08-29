# Technology Stack & Architecture (Bun + Express + React + TypeScript)

## 1. Architecture Overview

A high-performance full-stack application running on the **Bun** runtime. The backend is built with **Express.js + TypeScript** running natively on Bun, the frontend is built with **React + TypeScript + Tailwind CSS** bundled with Vite via Bun, and the data layer is powered by **PostgreSQL** with **`pgvector`** managed via **Prisma ORM**.

Authentication is implemented using **database-backed sessions** stored in PostgreSQL. AI features (classification, summarization, and suggested reply drafting) are powered by the **Anthropic Claude API**, and email communication is handled via **SendGrid / Mailgun** (inbound webhooks and outbound delivery). The application is containerized with **`oven/bun:1-alpine` Docker** images for lean, ultra-fast deployments.

---

## 2. Technology Breakdown

### 2.1. Runtime & Package Manager
* **Runtime:** **Bun (v1.1+)** – Native TypeScript execution, built-in fast package manager (`bun install`), test runner (`bun test`), and workspace monorepo management.
* **Workspaces:** Bun monorepo linking `/server` and `/client`.

### 2.2. Frontend
* **Core Framework:** **React 18+** with **TypeScript**
* **Build Tool:** **Vite** (executed via Bun)
* **Routing:** **React Router (v6+)**
* **Styling & UI:** **Tailwind CSS** + **shadcn/ui** (accessible Radix UI primitives) + **Lucide Icons**
* **State & Server Cache:** **TanStack Query (React Query)** for efficient ticket list caching, pagination, and real-time updates.
* **Draft Editor:** **TipTap** (Rich Text Editor) for agents to review, polish, format, and beautify AI-generated draft responses.

### 2.3. Backend
* **Runtime & Framework:** **Bun** + **Express.js** + **TypeScript** (direct TypeScript execution with zero compile overhead in development via `bun --watch src/server.ts`)
* **Architecture:** Layered REST API (Controllers, Services, Repositories, Middlewares)
* **Request Validation:** **Zod** for strict runtime type-checking on all API payloads and webhook events.
* **ORM:** **Prisma ORM** for type-safe database access, automated schema migrations, and relational modeling.

### 2.4. Authentication & Access Control (Database Sessions)
* **Session Management:** **`express-session`** with **`connect-pg-simple`** (PostgreSQL session table)
* **Mechanism:**
  * Client receives a signed, HTTP-only, secure `SameSite=lax` session cookie.
  * Active sessions and TTLs are persisted directly in the PostgreSQL database.
  * Instant session invalidation on logout or administrative revocation.
* **Password Hashing:** **Argon2** / **Bcrypt**
* **Role-Based Access Control (RBAC):** Middleware for `Admin` and `Agent` role enforcement.

### 2.5. Database & Vector Storage
* **Primary Database:** **PostgreSQL 16+**
* **Vector Search Extension:** **`pgvector`** (enables semantic vector search over Knowledge Base chunks directly inside PostgreSQL).
* **Database Management:** Managed PostgreSQL (e.g., Supabase, Neon, AWS RDS, or Railway Postgres).

### 2.6. AI & LLM Engine (Anthropic Claude)
* **Provider:** **Anthropic Claude API** (`@anthropic-ai/sdk`)
  * **Model Selection:**
    * **`claude-3-5-haiku`:** Ultra-fast, cost-effective for ticket classification (General Question, Technical Question, Refund Request), urgency/sentiment detection, and bulleted summaries.
    * **`claude-3-5-sonnet`:** High-reasoning RAG generation for drafting empathetic, human-friendly, and accurate student responses.
* **Embeddings & RAG:** Voyage AI / OpenAI embeddings stored in `pgvector` for Knowledge Base similarity search.

### 2.7. Email Ingestion & Outbound Dispatch
* **Provider:** **SendGrid** or **Mailgun**
  * **Inbound Ingestion:** Webhook endpoint (`POST /api/webhooks/inbound-email`) receiving parsed student emails and converting them into tickets.
  * **Outbound Delivery:** Transactional email API for sending agent-approved responses with proper email headers (`In-Reply-To`, `References`, Subject `[Ticket #...]`) to preserve email threading.

### 2.8. Deployment & Containerization
* **Containerization:** **Docker** with **`oven/bun:1-alpine`** multi-stage builds.
* **Orchestration:** **Docker Compose** for local full-stack development (Postgres + Express + React).
* **Cloud Hosting Providers:** Railway, Fly.io, AWS (ECS / Fargate / App Runner + RDS Postgres).

