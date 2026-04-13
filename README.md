# TEC Info Board

> A dual-surface information and administration platform for TEC — public kiosk display and authenticated staff workspace, built with Next.js, Better Auth, Drizzle ORM, and PostgreSQL.

![TEC Info Board Preview](preview.png)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Common Commands](#common-commands)
- [Authentication & Roles](#authentication--roles)
- [External Integrations](#external-integrations)
- [Deployment](#deployment)

---

## Overview

TEC Info Board is two applications in one:

| Surface | Path | Audience | Purpose |
|---|---|---|---|
| **Infoboard** | `/` | Public / kiosk screens | Real-time weather, departures, news, menu, traffic, contacts, calendar, messages |
| **Admin** | `/admin` | Teachers & admins | User management, content editing, tile config, analytics dashboard |

The infoboard is designed to run unattended on wall-mounted screens. The admin surface is a full content-management workspace with role-based permissions.

---

## Features

### Infoboard
- Live weather from the MET API with 5-day forecast
- Public-transport departures from two configurable stops (Rejseplanen)
- Traffic incidents from DR Trafik API
- Daily canteen dish + full menu inventory (Kanpla)
- Cached and enriched DR news articles
- Danish public calendar events (Kalendarium API)
- Staff contacts directory (sourced from `contacts.json`)
- Pinned and scheduled messages with repeat patterns
- Kitchen-duty (kokkenvagt) schedule
- Intranet pages rendered from rich markdown

### Admin
- Credential-based sign-in with IP + email rate limiting
- Invitation-based onboarding flow with email delivery
- Password reset via email token
- Role-based access control (`user`, `teacher`, `admin`)
- Message CRUD — scheduling with `activeFrom`, `expiresAt`, `repeatDays`, `pinned`, priority levels
- Calendar events + category management with cascade-safe deletion
- Intranet CMS with TipTap rich-text editor (tables, links, alignment, underline)
- File + avatar uploads with MIME and magic-byte validation
- Dynamic tile visibility/ordering persisted in the database
- Dashboard analytics with message timeseries chart
- Session cookie caching (5-minute window) to reduce database load

---

## Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript | ^5 |
| Runtime | Node.js | 20+ |
| UI Library | React | 19.2.3 |
| Auth | better-auth (credentials + admin plugin) | ^1.5.4 |
| ORM | Drizzle ORM | ^0.45.2 |
| Database | PostgreSQL | — |
| DB Driver | pg / @neondatabase/serverless | ^8.20.0 / ^1.0.2 |
| Styling | Tailwind CSS v4 + Sass | ^4 / ^1.98.0 |
| UI Primitives | Radix UI + shadcn/ui | ^1.4.3 |
| Rich Text | TipTap (core + extensions) | ^3.20.5 |
| Animation | Framer Motion | ^12.0.0 |
| Charts | Recharts | 3.8.0 |
| Email | Nodemailer | ^8.0.4 |
| Dates | date-fns | ^4.1.0 |
| Icons | Lucide React | ^0.575.0 |
| Markdown | react-markdown + remark-gfm | ^10.1.0 |
| Forms | react-day-picker, react-phone-number-input | ^9.14.0 / ^3.4.16 |
| Package Manager | pnpm | 9+ |
| Migrations CLI | drizzle-kit | ^0.31.9 |
| Linting | ESLint | ^9 |

---

## Architecture

### System Overview

```mermaid
flowchart TD
    A[Infoboard UI<br/>src/app/(infoboard)] --> C[API Route Handlers<br/>src/app/api]
    B[Admin UI<br/>src/app/admin] --> C
    C --> D[(PostgreSQL)]
    C --> E[MET Weather API]
    C --> F[Rejseplanen API]
    C --> G[Kanpla API]
    C --> H[DR Trafik API]
    C --> I[DR RSS + article pages]
    C --> J[Kalendarium API]
    B --> K[Better Auth Session]
    C --> K
    K --> D
```

### Request Flow — Message Creation

```mermaid
sequenceDiagram
    participant U as Staff User
    participant UI as Admin Client
    participant P as Proxy (src/proxy.ts)
    participant API as /api/messages
    participant Auth as Better Auth
    participant DB as PostgreSQL
    participant IB as Infoboard Client

    U->>UI: Fill in message form
    UI->>P: POST /api/messages
    P->>Auth: Validate session cookie
    Auth-->>P: Session + role
    P->>API: Forwarded request
    API->>API: Role check (teacher / admin)
    API->>DB: INSERT message
    API-->>UI: 201 Created
    IB->>API: Poll GET /api/messages
    API->>DB: SELECT active messages
    API-->>IB: Updated message list
```

### Request Flow — Invitation Onboarding

```mermaid
sequenceDiagram
    participant A as Admin
    participant API as /api/admin/invite
    participant DB as PostgreSQL
    participant Email as SMTP
    participant U as Invitee
    participant Inv as /api/invite/[token]

    A->>API: POST (email + role)
    API->>DB: INSERT invitation
    API->>Email: Send invite link
    U->>Inv: GET /invite/[token] (read metadata)
    U->>Inv: POST /invite/[token] (set password)
    Inv->>DB: Create user + mark invitation accepted
    U-->>Admin: Redirect to /admin
```

---

## Project Structure

```text
tec-info/
├── drizzle/
│   ├── *.sql                         # SQL migration files
│   └── meta/                         # Migration snapshots and journal
├── public/
│   ├── logo/                         # Brand SVG assets
│   └── weather/                      # Weather icon PNGs + symbol code mapping
├── src/
│   ├── app/
│   │   ├── (infoboard)/              # Public kiosk routes
│   │   │   ├── afgange/              # Departures panel
│   │   │   ├── beskeder/             # Messages panel
│   │   │   ├── intranet/             # Intranet viewer
│   │   │   ├── kalender/             # Calendar panel
│   │   │   ├── kantine/              # Canteen panel
│   │   │   ├── kokkenvagt/           # Kitchen duty panel
│   │   │   ├── kontakter/            # Contacts panel
│   │   │   ├── nyheder/              # News panel
│   │   │   ├── trafik/               # Traffic panel
│   │   │   └── vejr/                 # Weather panel
│   │   ├── admin/                    # Authenticated admin routes
│   │   │   ├── calendar/             # Calendar event management
│   │   │   ├── dashboard/            # Analytics overview
│   │   │   ├── display/              # Tile visibility settings
│   │   │   ├── intranet/             # Intranet CMS
│   │   │   ├── kokkenvagt/           # Kitchen duty management
│   │   │   ├── messages/             # Message management
│   │   │   ├── settings/             # Account / system settings
│   │   │   └── users/                # User + invitation management
│   │   ├── api/                      # REST API route handlers
│   │   ├── invite/                   # Invitation acceptance UI
│   │   ├── reset-password/           # Password reset UI
│   │   ├── layout.tsx                # Root layout + providers
│   │   ├── globals.css               # Global stylesheet
│   │   └── contacts.json             # Static contacts data source
│   ├── components/
│   │   ├── admin/                    # Admin-specific components
│   │   ├── intranet/                 # Intranet editor + renderer
│   │   ├── panels/                   # Infoboard panel components
│   │   └── ui/                       # Shared UI primitives (shadcn/ui)
│   ├── db/
│   │   ├── index.ts                  # Drizzle client singleton
│   │   ├── schema.ts                 # Full table definitions
│   │   └── seed.ts                   # Initial admin user seed
│   ├── hooks/
│   │   ├── use-api-data.ts           # Generic data-fetching hook
│   │   └── use-unsaved-changes-guard.ts
│   ├── lib/                          # Core utilities + auth helpers
│   ├── styles/                       # SCSS variables + animation sheets
│   ├── types/                        # Shared TypeScript types
│   └── proxy.ts                      # Next.js request interceptor (security headers, session check)
├── .env.example                      # Environment variable template
├── components.json                   # shadcn/ui component config
├── drizzle.config.ts                 # Drizzle ORM config
├── next.config.ts                    # Next.js runtime config
├── package.json
└── pnpm-workspace.yaml
```

---

## Database Schema

All tables are defined in [src/db/schema.ts](src/db/schema.ts).

### Tables

| Table | Purpose |
|---|---|
| `user` | User accounts with role (`user`, `teacher`, `admin`) |
| `session` | Better Auth session records |
| `account` | Auth provider accounts (credentials) |
| `verification` | Email verification tokens |
| `invitation` | Time-limited invite tokens |
| `message` | Scheduled infoboard messages |
| `setting` | Key-value config store (tile layout, etc.) |
| `dr_news_article` | Cached + enriched DR news articles |
| `wage_data` | Wage group data (JSON blob) |
| `kokkenvagt_entry` | Kitchen duty schedule entries |
| `intranet_page` | Intranet CMS pages (rich markdown content) |
| `calendar_event` | Calendar events |
| `calendar_category` | Calendar event categories |
| `auth_rate_limit` | Custom rate-limit state (IP + email) |

### Key Column Details

**`message`**
- `priority`: `normal` | `high` | `urgent`
- `activeFrom` / `expiresAt`: ISO timestamps for scheduling
- `repeatDays`: JSON array of weekday numbers (`0`–`6`)
- `pinned`: boolean — pinned messages always surface to the top

**`intranet_page`**
- `key`: unique slug used for routing
- `content`: rich markdown stored as text
- `isDraft`: boolean — drafts hidden from the infoboard

**`setting`**
- `key`: `tiles_config` — stores JSON array of tile visibility/order objects

---

## API Reference

### Public Endpoints (no auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/weather` | Current conditions + 5-day forecast (MET API) |
| `GET` | `/api/departures` | Departures from two configurable stops (Rejseplanen) |
| `GET` | `/api/trafik` | Active traffic incidents (DR Trafik) |
| `GET` | `/api/daily-dish` | Today's canteen dish (Kanpla) |
| `GET` | `/api/canteen` | Full canteen inventory (Kanpla) |
| `GET` | `/api/calendar` | Combined calendar event payload |
| `GET` | `/api/calendar/[year]` | Danish national calendar for a specific year |
| `GET` | `/api/dr-news` | Cached + enriched DR news feed |
| `GET` | `/api/kontakter` | Filtered staff contacts directory |
| `GET` | `/api/intranet-faq` | Published intranet FAQ entries |
| `GET` | `/api/tiles-config` | Current tile visibility / ordering config |

### Auth Endpoint

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/sign-in` | Rate-limited credential sign-in (IP + email) |
| `*` | `/api/auth/[...all]` | Better Auth managed endpoints |

### Messages (teacher / admin)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/messages` | Active public messages |
| `GET` | `/api/messages?admin=true` | All messages (admin view) |
| `POST` | `/api/messages` | Create a new message |
| `PATCH` | `/api/messages/[id]` | Update a message (own or admin) |
| `DELETE` | `/api/messages/[id]` | Delete a message (own or admin) |

### Kitchen Duty (teacher / admin)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/kokkenvagt` | Upcoming entries (public) |
| `GET` | `/api/kokkenvagt?admin=true` | All entries (admin view) |
| `POST` | `/api/kokkenvagt` | Create an entry |
| `PATCH` | `/api/kokkenvagt/[id]` | Update an entry |
| `DELETE` | `/api/kokkenvagt/[id]` | Delete an entry |

### Calendar Events (teacher / admin)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/calendar-events` | List events |
| `POST` | `/api/calendar-events` | Create event |
| `PATCH` | `/api/calendar-events/[id]` | Update event |
| `DELETE` | `/api/calendar-events/[id]` | Delete event |
| `GET` | `/api/calendar-categories` | List categories |
| `POST` | `/api/calendar-categories` | Create category |
| `DELETE` | `/api/calendar-categories/[id]` | Delete category (nullifies event references) |

### User & Invitation Management (admin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/users` | List all users |
| `POST` | `/api/admin/users` | Create user directly |
| `PATCH` | `/api/admin/users/[id]` | Update user |
| `DELETE` | `/api/admin/users/[id]` | Delete user (protected — cannot delete self or last admin) |
| `POST` | `/api/admin/invite` | Create invitation + send email |
| `POST` | `/api/admin/invite/resend` | Reissue an invite token |
| `GET` | `/api/invite/[token]` | Read invitation metadata |
| `POST` | `/api/invite/[token]` | Accept invitation + set password |

### File Uploads (teacher / admin)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/upload` | Upload document or image (MIME + magic-byte validated) |
| `POST` | `/api/admin/avatar` | Upload profile avatar |

### Dashboard (teacher / admin)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard/messages-chart` | Message creation timeseries |
| `PUT` | `/api/tiles-config` | Save tile visibility / order |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all required values.

### Required

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Random secret for session signing | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Auth base URL (can be comma-separated for multiple origins) | `http://localhost:3000` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Client-side auth URL | `http://localhost:3000` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` |
| `SMTP_USER` | SMTP username / From address | `no-reply@example.com` |
| `SMTP_PASS` | SMTP password / app password | — |
| `SMTP_SECURE` | Use TLS | `true` |

### Departures API

| Variable | Description | Default |
|---|---|---|
| `REJSEPLANEN_API_KEY` | Rejseplanen API key | — |
| `REJSEPLANEN_STOP_ID_1` | Primary stop ID | `3849` |
| `REJSEPLANEN_STOP_ID_2` | Secondary stop ID | `2859` |

### Optional

| Variable | Description |
|---|---|
| `COOKIE_DOMAIN` | Shared cookie domain for multi-subdomain setups (e.g. `.tec.dk`) |
| `NODE_OPTIONS` | Node.js options — automatically set to `--max-http-header-size=16384` via `dev` / `start` scripts |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **pnpm** 9 or later (`npm install -g pnpm`)
- A running **PostgreSQL** instance
- SMTP credentials for email features

### 1. Clone and install

```bash
git clone <repo-url>
cd tec-info
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Push the database schema

```bash
pnpm db:push
```

This applies the schema directly without generating migration files. Use `pnpm db:generate` + `pnpm db:migrate` for migration-based workflows.

### 4. Seed the initial admin user

```bash
pnpm seed
```

This creates the first admin account:

| Field | Value |
|---|---|
| Email | `admin@tec.dk` |
| Password | `rozbym-2vodsa-jakDox` |
| Role | `admin` |

> **Important:** Change this password immediately after first login in any non-local environment.

### 5. Start the development server

```bash
pnpm dev
```

The app is available at [http://localhost:3000](http://localhost:3000).
The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Common Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm seed` | Seed initial admin user |
| `pnpm db:push` | Push schema changes to the database (no migration file) |
| `pnpm db:generate` | Generate a new SQL migration file from schema changes |
| `pnpm db:studio` | Open Drizzle Studio (visual database browser) |

---

## Authentication & Roles

### How It Works

Authentication is handled by [Better Auth](https://better-auth.com) with the credentials provider and the admin plugin. Sessions are stored in the `session` table and cached in an httpOnly cookie.

**Session cookie caching** is enabled with a 5-minute maxAge — within that window the session is validated from the cookie alone, avoiding a database round-trip on every request.

The `src/proxy.ts` file is the central request interceptor. It applies security headers to all responses and forwards session information to API route handlers.

### Rate Limiting

Sign-in attempts are rate-limited at two levels:

| Level | Window | Limit | Block Duration |
|---|---|---|---|
| IP address | 15 minutes | 5 failures | 15 minutes |
| Email address | 24 hours | 5 failures | 24 hours |
| Better Auth (backup) | 60 seconds | 100 requests | — |

### Roles

| Role | Access |
|---|---|
| `user` | No admin access. Can sign in but has no write permissions. |
| `teacher` | Can create and manage own messages, kitchen duty entries, and calendar events. |
| `admin` | Full access — all of the above plus user management, invitations, tile config, and system settings. |

### Invitation Flow

1. Admin creates an invitation at **Admin → Users → Invite**.
2. System inserts a token in the `invitation` table and sends an email with a link to `/invite/[token]`.
3. Invitee opens the link, sets their password, and is redirected to `/admin`.
4. The invitation is marked as accepted and can no longer be used.

Admins can resend or reissue an expired invite token from the Users panel.

---

## External Integrations

All integrations are **read-only** — the app only consumes data from these services.

| Service | Endpoint | Data |
|---|---|---|
| **MET Weather API** | `api.met.no` | Current conditions, 5-day forecast, symbol codes |
| **Rejseplanen** | `xmlopen.rejseplanen.dk` | Real-time bus/train departures for configured stops |
| **DR Trafik** | DR API | Active road traffic incidents |
| **DR News** | DR RSS feed + article pages | News headlines, images, and body content (cached in `dr_news_article`) |
| **Kanpla** | `api.kanpla.dk` | Daily dish and full canteen menu inventory |
| **Kalendarium** | Kalendarium API | Danish national calendar and local events |

News articles are fetched from the DR RSS feed and then individually enriched with full body content. Enriched articles are cached in the `dr_news_article` table to avoid re-fetching on every infoboard poll.

---

## Deployment

The project is a standard Next.js application with no platform-specific configuration files. It can be deployed anywhere Node.js runs.

### Vercel

```bash
vercel deploy
```

Set all environment variables in the Vercel project dashboard. The `pg` package is already configured as a server external in `next.config.ts`.

### Self-hosted (Node.js)

```bash
pnpm build
pnpm start
```

Run behind a reverse proxy (nginx, Caddy) that handles TLS. Set `COOKIE_DOMAIN` if admin and infoboard run on separate subdomains.

### Docker (manual)

No `Dockerfile` is included. A minimal multi-stage build:

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> Enable `output: 'standalone'` in `next.config.ts` for the standalone Docker output.

### Database Migrations in CI/CD

Run schema migrations as part of your deploy pipeline before starting the server:

```bash
pnpm db:push   # or pnpm db:generate && pnpm db:migrate
```
