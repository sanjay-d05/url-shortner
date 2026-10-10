# Snip — URL Shortener

Full-stack URL shortener with analytics.

| Layer | Stack |
|---|---|
| API | NestJS 11 (TypeScript), clean architecture, Swagger |
| Database | PostgreSQL 16 + Prisma |
| Cache | Redis (redirect cache; app still works if Redis is down) |
| Auth | JWT access token (memory) + rotating refresh token (httpOnly cookie), bcrypt, API keys |
| Frontend | Next.js 15 (App Router), Tailwind v4, TanStack Query (server state), Redux Toolkit (browser state) |

## Local development

Requires Node 20+ and PostgreSQL. Redis is optional; the app still works if it is unavailable. Ensure `server/.env` and `client/.env.local` exist (copy the matching `.env.example` files if needed). Set `DATABASE_URL` in `server/.env` to your local PostgreSQL database and `NEXT_PUBLIC_API_URL` in `client/.env.local` to `http://localhost:4000`.

```bash
# API
cd server
cp .env.example .env
npm install
npm run prisma:migrate    # creates/applies versioned migrations
npm run start:dev         # http://localhost:4000

# Web (second terminal)
cd client
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

The first time you use a new database, run `npm run prisma:migrate` from `server/` to apply the committed migrations. Tests: `cd server && npm test` (unit tests + an HTTP end-to-end suite that runs against in-memory repositories, so no database is needed).

## Features

- Shorten URLs (anonymous or signed in), random 7-char base62 codes, custom aliases
- 302 redirects served by the API, Redis-cached; click logging is fire-and-forget so it never slows a redirect
- Expiry by date, click limits (atomic in SQL), password-protected links, enable/disable, edit, delete
- Tags, search, status filter, pagination, bulk select/delete
- Bulk shortening (paste URLs or upload CSV/TXT, download results as CSV)
- QR codes (view / download PNG), UTM builder
- Analytics per link: clicks, unique visitors, time series, countries, devices, browsers, OS, referrers; bot traffic is excluded
- Dashboard overview, API keys (`x-api-key` header), rate limiting, Google Safe Browsing check (optional), self-redirect blocking

## Clean architecture (server)

```
server/src/modules/<module>/
  domain/          entities, value objects (ShortCode, OriginalUrl), repository interfaces. No framework imports.
  application/     use cases (CreateShortLink, ResolveShortLink, RecordClick, ...) depend only on domain.
  infrastructure/  Prisma repositories, Redis cache, QR generator, Safe Browsing.
  presentation/    controllers, DTOs, guards.
```
Dependencies point inward only. Domain errors (`DomainError`) are mapped to HTTP codes by one exception filter.

## State ownership (client)

- **TanStack Query**: everything the server owns (links, analytics, API keys, QR).
- **Redux Toolkit**: everything the browser owns (auth session/token, table filters, selection, modals).

## Environment variables

See `server/.env.example` and `client/.env.example`. Change both JWT secrets for any real deployment.
`BASE_URL` is the public URL of the API (short links are `BASE_URL/<code>`); `FRONTEND_URL` is where the dashboard lives.

## Notes and known limits

- Country analytics come from CDN headers (`cf-ipcountry`, `x-vercel-ip-country`); without one, country shows "Unknown". Plug a GeoIP database into `RecordClick` if you need it self-hosted.
- Click logging is in-process fire-and-forget. For very high traffic, swap `ClickRepository` for a queue-backed implementation (e.g. BullMQ); the use case doesn't change.
- Schema changes are tracked under `server/prisma/migrations`; local development uses `prisma migrate dev`.
- If you already have a database created with the old `prisma db push` flow, back it up and verify its schema matches the current Prisma schema before adopting migrations. Then, from `server/`, mark the baseline as already applied with `npx prisma migrate resolve --applied 20261004150000_init`; do not run the initial migration against tables that already exist.
- The dashboard is guarded client-side (session restored from the refresh cookie on load) rather than by Next.js middleware, because the API and web app may live on different domains.
- Custom domains are not implemented.
