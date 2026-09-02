# AI-Powered Ticket Management System (Bun / Node + Express + React + TypeScript)

An enterprise-ready student support desk powered by **Anthropic Claude AI** for automated ticket classification, issue summarization, sentiment/urgency escalation, and RAG-grounded draft suggestions with **Human-in-the-Loop** agent review.

---

## 🛠️ Modern Tech Stack

* **Runtime & Package Manager:** **Bun (v1.1+)** / **Node.js** (Native TypeScript execution, workspace monorepo)
* **Backend:** **Express.js + TypeScript**
* **Authentication:** **Better Auth** (`better-auth`) with PostgreSQL database sessions, HTTP-only secure cookies, and role mapping (`ADMIN` / `AGENT`)
* **Database & Vector Search:** **PostgreSQL 16+** with **`pgvector`** managed via **Prisma ORM**
* **Frontend:** **React 18 + TypeScript + Vite** with **Tailwind CSS**, **shadcn/ui** (Slate default theme), **React Hook Form** + **Zod**, and **TipTap Rich Text Editor**
* **AI Engine:** **Anthropic Claude API** (`claude-3-5-haiku` & `claude-3-5-sonnet`)
* **Email:** SendGrid / Mailgun inbound webhooks and outbound replies
* **Containerization:** Multi-stage **Docker** using `oven/bun:1-alpine` & **Docker Compose**

---

## 🚀 Quick Start

### 1. Start PostgreSQL (with `pgvector`)
```bash
docker compose up -d
```

### 2. Install Dependencies across the Monorepo
```bash
npm install # or bun install
```

### 3. Setup Backend Database & Seeds
```bash
cd server
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and credentials

npx prisma migrate dev
npm run seed # or npx prisma db seed
```

### 4. Run Both Server & Client
```bash
# Start backend (http://localhost:5000)
cd server
npm start # or npm run dev

# In a separate terminal, start frontend (http://localhost:5173)
cd client
npm run dev
```
Open `http://localhost:5173/login` in your browser.

---

## 🔑 Staff Credentials

Credentials for staff accounts are set in `server/.env` via the seed variables (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, etc.) and are created by running:

```bash
cd server && npm run seed
```

> ⚠️ **Never use weak or default passwords.** Copy `server/.env.example` → `server/.env` and fill in strong, unique values before seeding.

---

## 🧪 Testing Inbound Email Simulation

Run the webhook simulator to send mock student inquiries (General question, Refund escalation, Technical issue) to the AI pipeline:

```bash
cd server
npx tsx scripts/simulateInboundEmail.ts
```
