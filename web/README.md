Learning Hub – Web

React + Vite + Tailwind (JavaScript) frontend. Dev server proxies API and files to the backend.

Setup (Windows dev)
1. `cd web`
2. `npm install`
3. `npm run dev`

Routes
- `/` – App shell
- `/signin` – Choose Student or Admin (Admin requires password via backend)
- `/library/*` – Library browser over the content folders, with per-folder search
  - Special: open `Library → Others → English Dictionary` to access the in-app dictionary

Build & preview
- `npm run build`
- `npm run preview`

Production
- Build: `npm run build`
- Copy `dist/` to your static server root (e.g., `/var/www/html`)
- Backend should be available at `http://127.0.0.1:3001` and reverse-proxied for `/api` and `/files`
- Set `NODE_ENV=production` on the server for deployed environments (e.g., Raspberry Pi over hotspot). Only use dev mode with CORS when iterating locally.

Accessibility & UX
- Keyboard focus rings enabled
- Accessible labels on interactive elements


