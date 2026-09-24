# Smart Medicine Reminder

A responsive medicine reminder prototype that helps users schedule, acknowledge, and review daily medicine doses.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/smart-medicine-reminder run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React + Vite
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/smart-medicine-reminder/src/App.tsx` — app shell, pages, forms, reminder modal
- `artifacts/smart-medicine-reminder/src/index.css` — visual tokens and responsive styles
- `artifacts/api-server/src/routes/` — auth, dashboard, medicine, reminder, and tablet routes
- `artifacts/api-server/src/lib/session.ts` — cookie sessions and password hashing
- `lib/db/src/schema/index.ts` — database source of truth
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `README.md` — user-facing setup, architecture, and limitations

## Architecture decisions

- The first account receives fictional demo data so the expo dashboard is not empty.
- Reminder rows are generated for up to 90 days and statuses are computed as due at read time.
- The browser alarm polls today's reminders and keeps the modal visible until Taken, Skip, or Dismiss.
- Tablet identification is deliberately labeled as a demo and never presents medical advice.
- The API contract is OpenAPI-first so the backend can be replaced without redesigning the frontend.

## Product

Users can register, manage medicine schedules and tablet images, receive browser-based reminders, record Taken or Skipped doses, review history, and run a clearly labeled demo tablet-identification flow.

## User preferences

- Keep this project beginner-friendly and suitable for a college viva.
- Do not add medicine recommendations, symptom checking, hospital suggestions, or medical advice.

## Gotchas

- Browser alarms are only reliable while the app is open or active; notifications depend on browser permission.
- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- The web build requires workflow-provided `PORT` and `BASE_PATH` values.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
