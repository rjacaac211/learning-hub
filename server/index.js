const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const { lookup: lookupMime } = require('mime-types');

// Load environment variables from .env if present
dotenv.config();

const PORT = parseInt(process.env.PORT, 10) || 3001;
const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(__dirname, 'content');
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

const app = express();

// Logging
if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS for local development front-end
if (NODE_ENV !== 'production') {
  app.use(
    cors({
      origin: 'http://localhost:5173',
      credentials: false
    })
  );
}

// Body parsing
app.use(express.json());

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Simple auth endpoint: role is 'student' (no password) or 'admin' (requires password)
app.post('/api/auth', (req, res) => {
  const role = String(req.body?.role || '').toLowerCase();
  const password = String(req.body?.password || '');

  if (role === 'student') {
    return res.json({ role: 'student' });
  }
  if (role === 'admin') {
    if (password === ADMIN_PASSWORD) {
      return res.json({ role: 'admin' });
    }
    return res.status(401).json({ error: 'Invalid password' });
  }
  return res.status(400).json({ error: 'Invalid role' });
});

// Helper: ensure a requested POSIX-style path is inside CONTENT_DIR
function safeResolveContent(posixPath) {
  // Normalize leading slash and decode
  const cleaned = (posixPath || '/').replace(/\\/g, '/');
  const rel = cleaned.startsWith('/') ? cleaned.slice(1) : cleaned;
  const parts = rel.split('/').filter(Boolean);
  const abs = path.resolve(CONTENT_DIR, ...parts);
  const inside = abs.startsWith(path.resolve(CONTENT_DIR) + path.sep) || abs === path.resolve(CONTENT_DIR);
  if (!inside) return null;
  return abs;
}

// Nodes endpoint: list one level of directories and files under given path (default root)
app.get('/api/nodes', async (req, res) => {
  const qPath = typeof req.query.path === 'string' ? req.query.path : '/';
  const abs = safeResolveContent(qPath);
  if (!abs) return res.status(400).json({ error: 'Invalid path' });

  let dirents;
  try {
    dirents = await fs.promises.readdir(abs, { withFileTypes: true });
  } catch (e) {
    return res.status(404).json({ error: 'Not Found' });
  }

  const dirs = [];
  const files = [];

  for (const d of dirents) {
    const name = d.name;
    if (name.startsWith('.')) continue; // skip hidden
    const childAbs = path.join(abs, name);
    const basePath = qPath.endsWith('/') ? qPath.slice(0, -1) : qPath;
    const childPosix = '/' + [basePath.replace(/^\//, ''), name].filter(Boolean).join('/');

    if (d.isDirectory()) {
      dirs.push({ name, path: childPosix });
    } else if (d.isFile()) {
      let stat;
      try {
        stat = await fs.promises.stat(childAbs);
      } catch {
        continue;
      }
      files.push({
        name,
        path: childPosix,
        size: stat.size,
        mime: lookupMime(name) || null
      });
    }
  }

  // Sort: directories alphabetically, files alphabetically
  dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const pathName = qPath === '/' ? '' : qPath.replace(/^\/+/, '');
  const segments = pathName.split('/').filter(Boolean);
  const name = segments.length ? segments[segments.length - 1] : '';

  res.json({ path: qPath === '' ? '/' : qPath, name, dirs, files });
});

// Static file serving with path traversal protection
// Using express.static is safe for traversal; configure dotfiles denied and no fallthrough
app.use(
  '/files',
  express.static(CONTENT_DIR, {
    dotfiles: 'deny',
    fallthrough: false,
    setHeaders: (res) => {
      // basic security headers for files
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  })
);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Learning Hub server listening on http://localhost:${PORT}`);
  console.log(`Serving content from: ${CONTENT_DIR}`);
});



