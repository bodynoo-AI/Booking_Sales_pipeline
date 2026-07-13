# EventHub360

EventHub360 is a full-stack event/venue **booking management system**. It lets a sales/operations team manage the entire lifecycle of an event booking — from initial hold and confirmation, through deposits, change orders, conflicts, and documents, to final handoff and reporting.

The project is split into two apps:

```
event-updated/
├── Backend/     Node.js + Express + Prisma REST API (TypeScript)
└── Frontend/    React + Vite single-page app (TypeScript)
```

---

## 1. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Web framework | Express 5 |
| ORM / DB layer | Prisma 6 |
| Database | PostgreSQL (default) — MySQL variant also available |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` password hashing + cookies |
| Realtime | Socket.IO |
| File uploads | Multer |
| Validation | Zod |
| PDF generation | Custom PDF builder util (booking confirmations, work orders, client detail sheets) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| UI library | Ant Design (`antd`) + `@ant-design/icons` |
| Data fetching | TanStack React Query |
| Forms | React Hook Form + Zod resolvers |
| Routing | React Router DOM |
| Realtime | Socket.IO client |
| Dates | Day.js |
| Testing | Vitest |

---

## 2. Core Features

- **Authentication** — login, register, refresh token, logout, forgot/reset password, profile management, change password.
- **Bookings** — create, list, view, update; full status lifecycle (`PENDING → ON_HOLD → CONFIRMED → IN_PROGRESS → COMPLETED / CANCELLED`); booking timeline/activity log.
- **Holds** — place a temporary hold on a booking/date with expiry and status tracking (`ACTIVE`, `EXPIRED`, `RELEASED`).
- **Deposit schedules** — define deposit installments per booking, track paid/pending/overdue status.
- **Change orders** — request and approve/reject changes to a booking's scope with an amount delta.
- **Conflict detection** — check and list scheduling conflicts across bookings/venues.
- **Calendar** — booking calendar view and dashboard calendar summary.
- **Venues** — manage a venue directory (capacity, type, city, status).
- **Documents** — upload/download/delete booking documents, plus on-the-fly generated documents (confirmation letters, work orders, event briefs, client PDF).
- **Handoff** — structured checklist to hand a confirmed booking off to the operations team.
- **Dashboard** — key stats, alerts, and calendar summary.
- **Reports** — booking register, calendar utilisation, cancellations, and conversion-time reports.
- **Realtime updates** — Socket.IO pushes live changes (e.g. bookings/holds) to connected clients.

---

## 3. Database Schema

The database has **11 tables**, defined in `Backend/prisma/schema.prisma`:

| Table | Purpose |
|---|---|
| `Client` | Customer/client records |
| `Venue` | Venue directory |
| `Booking` | Core booking record (dates, revenue, status, deposits, etc.) |
| `Hold` | Temporary holds placed on a booking |
| `DepositSchedule` | Deposit installments for a booking |
| `ChangeOrder` | Requested changes to a booking's scope/price |
| `BookingHandoff` | Handoff checklist from sales to operations |
| `BookingActivity` | Activity/audit log per booking |
| `BookingDocument` | Uploaded files attached to a booking |
| `User` | Application users (staff accounts) |
| `PasswordReset` | Password reset tokens |

**Enums:** `BookingStatus`, `HoldStatus`, `DepositStatus`, `ChangeOrderStatus`.

Relationships: a `Client` has many `Booking`s; a `Booking` has many `Hold`s, `DepositSchedule`s, `ChangeOrder`s, `BookingActivity`s, `BookingDocument`s, and one `BookingHandoff`; a `User` has one `PasswordReset`.

- **Default database:** PostgreSQL (see `Backend/prisma/migrations/`).
- **MySQL version:** an equivalent schema + DDL + ready-to-run Docker setup lives under `Backend/prisma/mysql/` for teams that prefer MySQL.

> Note: the `Venue` model is defined in `schema.prisma` but currently has no Postgres migration applied yet — run a migration to create it if you rely on the venues feature.

---

## 4. API Overview

Base URL: `http://localhost:5000/api`

| Prefix | Handles |
|---|---|
| `/auth` | login, register, refresh, logout, forgot/reset password, profile, change password |
| `/bkg/bookings` | booking CRUD, timeline, confirm/start/complete/cancel, holds, deposit schedule, change orders, handoff, client PDF, documents |
| `/bkg/dashboard` | stats, alerts, calendar summary |
| `/bkg/conflicts` | list conflicts, check conflicts |
| `/bkg/calendar` | calendar events |
| `/bkg/venues` | list/create venues |
| `/bkg/holds` | holds, deposits, change orders, handoffs (cross-booking views) |
| `/bkg/reports` | register, calendar utilisation, cancellations, conversion time |

Most routes beyond `/auth` and reads are protected by JWT auth middleware (`authMiddleware`) on sensitive actions (documents, client PDF, profile).

---

## 5. Project Structure

### Backend (`Backend/src`)
```
config/       Prisma client instance, JWT config
controllers/  Request handlers (one per feature area)
middleware/   Auth middleware
routes/       Express routers, mounted in app.ts
services/     Business logic (booking, hold, venue, calendar, auth, dashboard, conflict, report)
utils/        PDF builder, booking helper utilities
app.ts        Express app setup, route mounting
server.ts     HTTP server bootstrap + Socket.IO init
socket.ts     Socket.IO setup
```

### Frontend (`Frontend/src/modules/bkg`)
```
dashboard/    Dashboard screen
bookings/     Booking list, details, create/edit wizard
screens/      Calendar, Holds, Conflicts, Deposits, Change Orders,
              Cancellations, Handoff/Documents, Venues, Reports
components/   Shared layout/UI components
hooks/        Custom React hooks
services/     API client calls (axios)
schemas/      Zod validation schemas
types/        TypeScript types
routes/       React Router route definitions
```

---

## 6. Getting Started

### Prerequisites
- Node.js (LTS)
- A PostgreSQL database (or MySQL — see `Backend/prisma/mysql/README.md`)

### Backend setup
```bash
cd Backend
npm install
```

Create `Backend/.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/eventhub360"
PORT=5000
JWT_SECRET="your_secret_here"
```

Run migrations and generate the Prisma client:
```bash
npx prisma migrate dev
npx prisma generate
```

Start the dev server:
```bash
npm run dev
```
API runs at `http://localhost:5000`.

### Frontend setup
```bash
cd Frontend
npm install
npm run dev
```
App runs at the Vite dev URL (default `http://localhost:5173`).

### Production build
```bash
# Backend
cd Backend && npm run build && npm start

# Frontend
cd Frontend && npm run build
```

---

## 7. Switching to MySQL

If you'd rather run MySQL instead of Postgres, see `Backend/prisma/mysql/README.md`. It includes:
- A MySQL-flavored `schema.prisma`
- Raw MySQL `CREATE TABLE` DDL for all 11 tables
- A ready-to-run Docker Compose setup that creates a live MySQL database automatically

---

## 8. Booking Status Flow

```
PENDING → ON_HOLD → CONFIRMED → IN_PROGRESS → COMPLETED
                                            ↘ CANCELLED
```

- `Hold.status`: `ACTIVE → EXPIRED / RELEASED`
- `DepositSchedule.status`: `PENDING → PAID / OVERDUE`
- `ChangeOrder.status`: `PENDING → APPROVED / REJECTED`

---

## 9. License

Not specified (add a license if this project will be distributed).
