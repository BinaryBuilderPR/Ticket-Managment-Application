# Technology Stack: Bun + Express + React + TypeScript

See complete specifications in [techstack.md](file:///c:/Users/piyus/OneDrive/Documents/Lab/Ticket%20Managment%20Application/techstack.md).

- **Runtime:** Bun v1.1+ (Monorepo Workspaces)
- **Backend:** Express + TypeScript running directly with `bun --watch src/server.ts`
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + TipTap Editor
- **Database:** PostgreSQL 16+ with `pgvector`
- **Auth:** Database-backed sessions (`connect-pg-simple` + `express-session`)
- **AI:** Anthropic Claude API (`claude-3-5-haiku` & `claude-3-5-sonnet`)
- **Email:** SendGrid / Mailgun inbound webhooks & outbound dispatch
- **Docker:** `oven/bun:1-alpine` multi-stage build