# AI-Powered Ticket Management System (Bun + Express + React + TypeScript)

An enterprise-ready student support desk powered by **Anthropic Claude AI** for automated ticket classification, issue summarization, sentiment/urgency escalation, and RAG-grounded draft suggestions with **Human-in-the-Loop** agent review.

Built on the ultra-fast **Bun** runtime across the entire stack.

---

## 🛠️ Modern Tech Stack

* **Runtime & Package Manager:** **Bun (v1.1+)** (Native TypeScript execution, workspace monorepo, fast installations)
* **Backend:** **Express.js + TypeScript** running on Bun
* **Frontend:** **React 18 + TypeScript + Vite** with Tailwind CSS, shadcn/ui, and TipTap Rich Text Editor
* **Database & ORM:** **PostgreSQL 16+** with **`pgvector`** managed via **Prisma ORM**
* **Authentication:** **Database-Backed Sessions** (`express-session` + `connect-pg-simple` stored in PostgreSQL)
* **AI Engine:** **Anthropic Claude API** (`claude-3-5-haiku` & `claude-3-5-sonnet`)
* **Email:** SendGrid / Mailgun inbound webhooks and outbound replies
* **Containerization:** Multi-stage **Docker** using `oven/bun:1-alpine`

---

## 🚀 Quick Start with Bun

### 1. Start PostgreSQL (with `pgvector`)
```bash
docker compose up -d
```

### 2. Install Dependencies across the Monorepo
```bash
# From project root
bun install
```

### 3. Setup Backend Database & Seeds
```bash
cd server
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and credentials

bun x prisma migrate dev
bun run seed
```

### 4. Run Both Server & Client
From the project root:
```bash
# Run server (http://localhost:5000)
bun run dev:server

# In a separate terminal, run client (http://localhost:5173)
bun run dev:client
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Default Credentials (from Seed)

* **Admin Account:**
  * **Email:** `admin@institution.edu`
  * **Password:** `AdminSecurePassword123!`
* **Demo Agent Account:**
  * **Email:** `agent@institution.edu`
  * **Password:** `AgentSecurePassword123!`

---

## 🧪 Testing Inbound Email Simulation with Bun

Run the webhook simulator with Bun to send mock student inquiries (General question, Refund escalation, Technical issue) to the AI pipeline:

```bash
bun server/scripts/simulateInboundEmail.ts
```

