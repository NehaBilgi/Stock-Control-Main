# IndustrialOps — Enterprise Inventory Management System

An enterprise-grade industrial inventory management system for maintenance consumables (grease, lubricants, oils, belts, bearings, filters, spare parts, tools).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/inventory-app run dev` — run the frontend (port 24449)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, Tailwind CSS, shadcn/ui, Recharts, Zustand
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Simple token-based auth (SHA-256 + base64 encoded, stored in localStorage)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Barcode scanning: html5-qrcode
- Excel export: xlsx

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB tables: users, categories, locations, products, transactions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/inventory-app/src/` — React frontend
  - `src/lib/auth.ts` — Zustand auth store (token management)
  - `src/pages/` — All page components
  - `src/components/layout/Sidebar.tsx` — Main navigation sidebar

## Architecture decisions

- Token auth: Simple SHA-256 hash with salt stored in localStorage, decoded base64 on server — no JWT dependency needed for this internal tool.
- Stock tracking: currentStock updated atomically on each transaction; transactions record the resulting balance for audit trail.
- Alerts computed at query time (not stored) — always reflects real-time stock state.
- Product ID auto-generated as PRD-XXXXX, Transaction ID as TXN-XXXXX.
- Numeric fields stored as PostgreSQL `numeric` (string in JS) to avoid float precision issues; converted to `number` in API responses.

## Product

- Product master management (30+ fields per product including barcode, storage location, costs, dates)
- Barcode scanning via mobile camera (html5-qrcode)
- Stock in/out transactions with full audit trail (work order, department, employee)
- Real-time dashboard (7 stat cards, charts, alerts)
- Reports: Stock Summary, Stock Movement, Low Stock, Expiry — with Excel/CSV export
- Alerts: Low stock, out of stock, reorder, expiry, warranty expiry
- Multi-location inventory management
- Role-based access: admin, inventory_manager, store_keeper, auditor, read_only
- Dark/light mode

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Numeric DB fields return as strings from Drizzle — always call `parseFloat()` in route handlers before returning.
- Auth token is stored in `localStorage` under key `inventory_token`.
- Default login credentials: admin/admin123, manager/manager123, keeper/keeper123.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
