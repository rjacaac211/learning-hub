Learning Hub – Web

React + Vite + Tailwind (JavaScript) frontend. Dev server proxies API and files to the backend.

Setup (Windows dev)
1. `cd web`
2. `npm install`
3. `npm run dev`

Routes
- `/` – Landing (Welcome + Enter button)
- `/categories` – Shows cards for English, Math, Science
- `/category/:slug` – Lists files for the chosen category, with search and open link

Build & preview
- `npm run build`
- `npm run preview`

Production
- Build: `npm run build`
- Copy `dist/` to your static server root (e.g., `/var/www/html`)
- Backend should be available at `http://127.0.0.1:3001` and reverse-proxied for `/api` and `/files`

Accessibility & UX
- Keyboard focus rings enabled
- Accessible labels on interactive elements


