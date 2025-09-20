Learning Hub – Server

Node 20 + Express 4 (CommonJS). Provides content listing and static file serving.

Environment
- `PORT` (default: 3001)
- `CONTENT_DIR` (default: `./content` in this folder for local dev)

Setup (Windows dev)
1. `cd server`
2. Copy env: PowerShell `copy .env.example .env` (or `cp .env.example .env`)
3. Optionally set `CONTENT_DIR` to an absolute path
4. `npm install`
5. `npm run dev`

Endpoints
- `GET /api/health` → `{ ok: true }`
- `GET /api/modules` → `[ { name, rel, size, mime, breadcrumbs } ]`
- Static files at `/files` (mounted from `CONTENT_DIR`)

Static security
- Path traversal protected by `express.static`
- `dotfiles: 'deny'`, `fallthrough: false`

Production (Raspberry Pi)
1. Create content directory: `/home/<user>/content` and add `english/`, `math/`, `science/` subfolders
2. `cd server && npm ci`
3. Run: `npm start` (or via pm2 using repo `ecosystem.config.js`)
4. Serve frontend build separately (see web README). Nginx recommended.

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


