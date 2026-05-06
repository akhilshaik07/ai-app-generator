# AI App Generator

An opinionated, config-driven SaaS Engine that transforms JSON specifications into fully working full-stack applications (UI, APIs, and Database schema) dynamically.

## Live Demo
🔗 [your-vercel-url.vercel.app](https://your-app.vercel.app)

## Built For
Full Stack Developer Internship — Track A: AI App Generator

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       AI APP GENERATOR                      │
├─────────────────────────┬───────────────────────────────────┤
│    FRONTEND (Next.js)   │     BACKEND (Express + Node)      │
│                         │                                   │
│  - Zustand Store        │  - Config Parser & Validater      │
│  - Monaco Editor        │  - Schema Generator (SQL)         │
│  - Live Glass Preview   │  - Dynamic CRUD Routes            │
│  - Dynamic Renderers    │  - CSV Import Engine              │
│  - Obsidian UI Theme    │  - GitHub Octokit Exporter        │
└─────────────────────────┴─────────────────┬─────────────────┘
                                            │
                                            ▼
                              ┌────────────────────────┐
                              │ SUPABASE (Postgres DB) │
                              │ - app_registry table   │
                              │ - Dynamic app tables   │
                              └────────────────────────┘
```

## Setup Instructions

1. Clone repository
2. Install dependencies: `npm install`
3. Database Setup:
   Provide the following credentials via `.env`:
   ```
   PORT=4000
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_ANON_KEY=...
   JWT_SECRET=...
   GITHUB_PERSONAL_ACCESS_TOKEN=...
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```
4. Run locally: `npm run dev`

The Next.js frontend will run on `http://localhost:3000` and the Express backend will run on `http://localhost:4000`. Next.js handles proxying API queries gracefully to Express.

## Features

- [x] Monaco JSON Editor with valid syntax parsing and auto-format
- [x] Real-time Glass Canvas Builder preview
- [x] Obsidian Studio custom design aesthetic with Vercel Geist fonts
- [x] Dynamic Form rendering mapping UI fields strictly to DB schema
- [x] Dynamic Table with built-in search, sorting, and pagination
- [x] Complete Backend generated with Express + Node + Supabase JS Client
- [x] Supabase DDL execution via RPC commands or standard SQL definitions
- [x] Error boundaries and resilient failover components

## To Add New Component
Inject new components directly into `COMPONENT_REGISTRY` in `components/runtime/Renderer.tsx`.
