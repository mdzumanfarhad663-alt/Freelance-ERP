# Freelance ERP OS

ERP SaaS for freelancers — clients, projects, tasks, and invoices. **Phase 1: foundation** (auth, database schema, dashboard shell). CRUD features arrive in Phase 2.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma · NextAuth v5 · Zod

## Setup

1. **Database** — create a free PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com) and copy the connection string.

2. **Environment** — edit `.env` (see `.env.example`):

   ```env
   DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
   AUTH_SECRET="<npx auth secret>"
   ```

3. **Migrate + seed**

   ```bash
   npm run db:migrate   # creates tables
   npm run db:seed      # creates the admin user
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 — you'll be redirected to `/login`.

   Default admin: `admin@example.com` / `admin123` (override via `SEED_ADMIN_*` env vars before seeding).

## Structure

```
prisma/schema.prisma      # User, Client, Project, Task, Invoice
src/lib/auth.ts           # NextAuth v5 (credentials + JWT)
src/lib/auth.config.ts    # Edge-safe config shared with middleware
src/lib/db.ts             # Prisma client singleton
src/proxy.ts              # Route protection (Next 16 proxy/middleware)
src/app/(dashboard)/      # Protected shell: dashboard, clients, projects, tasks, invoices
src/app/login/            # Login page + server action
src/app/api/              # auth (live) + clients/projects/tasks/invoices (501 stubs)
src/components/layout/    # Sidebar, Topbar, DashboardShell
```

## Roadmap

- **Phase 2** — CRUD for clients, projects, tasks, invoices
- **Phase 3** — Kanban, invoicing workflow, automation
