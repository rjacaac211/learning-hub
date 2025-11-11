Learning Hub – Server

Node 20 + Express 4 (CommonJS). Provides content listing and static file serving.

Environment
- `PORT` (default: 3001)
- `CONTENT_DIR` (default: `./content` in this folder for local dev)
- `ADMIN_PASSWORD` (default: `admin`)
- `ADMIN_TOKEN_SECRET` (default: `dev-secret-change-me`) used to sign admin tokens
- `ADMIN_TOKEN_TTL` (default: `12h`) admin token expiry
- `NODE_ENV` (default: `development`) enables CORS in dev
- `DICT_DIR` (default: `../english-dictionary`) path to the English Dictionary dataset
- `RAW_DIR` (optional) source folder for import script; defaults to repo `raw_files/`

Setup (Windows dev)
1. `cd server`
2. Copy env: PowerShell `copy .env.example .env` (or `cp .env.example .env`)
3. Optionally set `CONTENT_DIR` to an absolute path
4. `npm install`
5. `npm run dev`

Endpoints
- `GET /api/health` → `{ ok: true }`
- `POST /api/auth` → Body `{ role: 'student' }` or `{ role: 'admin', password }`. Returns `{ role }`. Uses `ADMIN_PASSWORD` env (default `admin`) for admin verification.
- `GET /api/nodes?path=/...` → Lists a single level of directories/files under the provided POSIX-style path. Returns `{ path, name, dirs: [{name, path}], files: [{name, path, size, mime}] }`.
- Static files at `/files` (mounted from `CONTENT_DIR`)
- Dictionary:
  - `GET /api/dictionary/search?query=<text>&limit=20` → `string[]` of matching words (prefix search)
  - `GET /api/dictionary/word/:word` → `{ word, definitions: [{ pos, definition }] }` (reads from `DICT_DIR`)

Static security
- Path traversal protected by `express.static`
- `dotfiles: 'deny'`, `fallthrough: false`

Production (Raspberry Pi)
1. Create content directory: `/home/<user>/content` (or desired path) and mirror the learning hierarchy (see Structure sync)
2. `cd server && npm ci`
3. Run: `npm start` (or via pm2 using repo `ecosystem.config.js`)
4. Serve frontend build separately (see web README). Nginx recommended.
5. Set `NODE_ENV=production` in your `.env` for a safer setup over hotspot/Wi‑Fi.

Recommended `.env` for Raspberry Pi
```
PORT=3001
CONTENT_DIR=/home/pi/content
DICT_DIR=../english-dictionary

# Authentication
ADMIN_PASSWORD=change-me
ADMIN_TOKEN_SECRET=use-a-strong-secret
ADMIN_TOKEN_TTL=12h

# Environment
NODE_ENV=production
```

Development over hotspot (temporary)
- If you must expose the Vite dev server to devices, keep `NODE_ENV=development` and change the CORS origin in `server/index.js` to your Pi’s IP (e.g., `http://192.168.4.1:5173`). This is for temporary testing only; prefer the production setup above.

Structure sync
- Mirror the learning hierarchy described in the repo `structure.md` under your `CONTENT_DIR`:
  - One-time sync (idempotent): `npm run sync-structure`
  - Env: `CONTENT_DIR` (default: `./content`), `ADMIN_PASSWORD` (default: `admin`)

Import PDFs
- Move PDF files from `RAW_DIR` into the canonical `.../Learning Materials/` folders under `CONTENT_DIR`:
  - Run: `npm run import-pdfs`
  - Options: set `RAW_DIR` env, or pass `--raw "<path>"` (e.g., `npm run import-pdfs -- --raw "D:\\Users\\RJ\\Side Projects\\learning-hub\\raw_files"`)
  - Behavior: ignores videos, fuzzy-matches folder names against `structure.md`, skips low-confidence matches and logs to `server/import-pdfs.log`.

Nginx sample
Use this site config (adapt paths to your setup):

```
server {
  listen 80 default_server;
  server_name _;

  root /var/www/html;  # built web/dist files copied here
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
  }

  location /files/ {
    proxy_pass http://127.0.0.1:3001/files/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
  }
}
```

Notes
- In production, do not enable CORS; serve both through the same origin via Nginx.
- For development, CORS is enabled for `http://localhost:5173`.


