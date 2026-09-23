# touhfaye

A full-stack e-commerce application with a Next.js client and an Express/Prisma server.

## Project structure

- [`client/`](client) — Next.js frontend
- [`server/`](server) — Express + Prisma backend API

## Getting started

### Server

```bash
cd server
npm install
npm run dev
```

The API runs on `http://localhost:5000` by default (set `PORT` in `server/.env` to override).

### Client

```bash
cd client
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

See [`client/README.md`](client/README.md) for more details on the frontend, and `server/prisma/schema.prisma` for the database schema.
