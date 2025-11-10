Learning Hub (Full-Stack)

This repository contains a small, production-ready full‑stack app designed to run locally on Windows for development and deploy on a Raspberry Pi 4 (Node 20) for production.

Structure:
- `/server` – Node 20 + Express 4 (CommonJS)
- `/web` – React + Vite + Tailwind (JavaScript)

Dev quick start (Windows):
1) Server
   - `cd server`
   - `copy .env.example .env` (PowerShell) or `cp .env.example .env`
   - Edit `.env` if needed. By default `CONTENT_DIR=./content`. Mirror the hierarchy from `structure.md` using `npm run sync-structure`.
2) Install dependencies
   - `npm install --prefix server`
   - `npm install --prefix web`
3) Run both (from repo root)
   - `npm run dev`
   - Or in two terminals: `npm run dev --prefix server` and `npm run dev --prefix web`

Production on Raspberry Pi (overview):
- Create content directory: `/home/<user>/content` (or preferred path) and mirror the learning hierarchy (`npm run sync-structure` from `/server` is a helper).
- Server: `cd server && npm ci && npm start` (or run with pm2, see `/server/README.md`).
- Web: `cd web && npm ci && npm run build`, then copy `web/dist` to `/var/www/html` (or serve with Nginx). See `/server/README.md` for an Nginx sample.

Root scripts:
- `npm run dev` – Runs both server and web via `concurrently`.

Notes:
- Backend runs on port 3001 by default. Frontend dev server proxies `/api` and `/files` to `http://localhost:3001`.
- In production, serve `web/dist` at `/` and reverse proxy `/api` and `/files` to the backend.


