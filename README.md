# Snip: URL Shortener

A full-stack URL shortener with link management and analytics.

## Stack

| Area | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS 4, TanStack Query, Redux Toolkit |
| API | NestJS 11, TypeScript, Swagger |
| Database | PostgreSQL 16, Prisma |
| Cache | Redis (optional; the API continues without it) |
| Authentication | JWT, rotating refresh tokens in an HTTP-only cookie, bcrypt |

## Features

- Create short links with random or custom codes, with or without an account
- Redirect through the API with Redis caching and asynchronous click logging
- Set expiration dates and click limits; protect, edit, disable, and delete links
- Organize links with tags; search, filter, paginate, and bulk delete
- Create links in bulk from pasted URLs or CSV/TXT files, and export results to CSV
- Generate QR codes and UTM links
- View click, visitor, location, device, browser, OS, and referrer analytics
- Manage API keys and use rate limiting and optional Google Safe Browsing checks

## Local development

Requirements: Node.js 20+ and PostgreSQL. Redis is optional.

1. Create `server/.env` from `server/.env.example` and set `DATABASE_URL` to your PostgreSQL database.
2. Create `client/.env.local` from `client/.env.example` and set `NEXT_PUBLIC_API_URL=http://localhost:4000`.
3. Start the API:

   ```bash
   cd server
   npm install
   npm run prisma:migrate
   npm run start:dev
   ```

4. In a second terminal, start the frontend:

   ```bash
   cd client
   npm install
   npm run dev
   ```

The API runs at `http://localhost:4000`; Swagger docs are at `/api/docs`. The frontend runs at `http://localhost:3000`.

For a new database, `npm run prisma:migrate` applies the committed migrations. Run the server test suite with `cd server && npm test`; its end-to-end tests use in-memory repositories.

## Deployment

### API on Render

Create a Render Web Service with the repository's `server` directory as its root:

- Build command: `npm install --include=dev && npm run build`
- Start command: `npm run start:prod`

On startup, the production script applies committed migrations with `prisma migrate deploy` before starting the API. Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `BASE_URL`, and `FRONTEND_URL` in the service environment. Set `REDIS_URL` if using Redis.

### Frontend on Vercel

Create a Vercel project from the same repository with `client` as the root directory. Set `NEXT_PUBLIC_API_URL` to the deployed API URL, such as `https://your-api.onrender.com`.

## Environment variables

See `server/.env.example` and `client/.env.example`. Use strong, separate JWT secrets in production. `BASE_URL` is the public API URL used to form short links; `FRONTEND_URL` is the deployed dashboard URL.

## Project structure

The server uses a layered architecture under `server/src/modules/<module>/`:

```text
domain/          Entities, value objects, and repository interfaces
application/     Use cases
infrastructure/  Prisma, Redis, QR generation, and external integrations
presentation/    Controllers, DTOs, and guards
```

The frontend uses TanStack Query for server data and Redux Toolkit for client state.

