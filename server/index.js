const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const { lookup: lookupMime } = require('mime-types');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const os = require('os');

// Load environment variables from .env if present
dotenv.config();

const PORT = parseInt(process.env.PORT, 10) || 3001;
const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(__dirname, 'content');
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'dev-secret-change-me';
const ADMIN_TOKEN_TTL = process.env.ADMIN_TOKEN_TTL || '12h';

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
      const token = jwt.sign({ role: 'admin' }, ADMIN_TOKEN_SECRET, { expiresIn: ADMIN_TOKEN_TTL });
      return res.json({ role: 'admin', token });
    }
    return res.status(401).json({ error: 'Invalid password' });
  }
  return res.status(400).json({ error: 'Invalid role' });
});

// Middleware: require admin bearer token
function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, ADMIN_TOKEN_SECRET);
    if (payload?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.admin = { ok: true };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

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

// --- Admin: folders CRUD ---
function isValidName(name) {
  if (typeof name !== 'string') return false;
  if (name.length === 0) return false;
  if (/[\\\/\0]/.test(name)) return false;
  // Trim whitespace-only names
  if (name.trim().length === 0) return false;
  // Disallow names starting with dot to avoid hidden/system files
  if (name.startsWith('.')) return false;
  return true;
}

// Create folder
app.post('/api/admin/folders', requireAdmin, async (req, res) => {
  const parentPath = typeof req.body?.parentPath === 'string' ? req.body.parentPath : '/';
  const name = String(req.body?.name || '');

  if (!isValidName(name)) return res.status(400).json({ error: 'Invalid folder name' });

  const parentAbs = safeResolveContent(parentPath);
  if (!parentAbs) return res.status(400).json({ error: 'Invalid path' });

  try {
    const stat = await fs.promises.stat(parentAbs);
    if (!stat.isDirectory()) return res.status(400).json({ error: 'Parent is not a directory' });
  } catch {
    return res.status(404).json({ error: 'Parent not found' });
  }

  const targetAbs = path.join(parentAbs, name);
  try {
    await fs.promises.mkdir(targetAbs, { recursive: false });
  } catch (e) {
    return res.status(409).json({ error: 'Folder already exists' });
  }

  const basePath = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;
  const childPosix = '/' + [basePath.replace(/^\//, ''), name].filter(Boolean).join('/');
  return res.status(201).json({ ok: true, name, path: childPosix });
});

// Rename folder
app.patch('/api/admin/folders/rename', requireAdmin, async (req, res) => {
  const folderPath = typeof req.body?.path === 'string' ? req.body.path : '';
  const newName = String(req.body?.newName || '');
  if (!folderPath) return res.status(400).json({ error: 'Missing path' });
  if (!isValidName(newName)) return res.status(400).json({ error: 'Invalid folder name' });

  const abs = safeResolveContent(folderPath);
  if (!abs) return res.status(400).json({ error: 'Invalid path' });

  let stat;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!stat.isDirectory()) return res.status(400).json({ error: 'Path is not a directory' });

  const parentDir = path.dirname(abs);
  const newAbs = path.join(parentDir, newName);
  if (newAbs === abs) return res.json({ ok: true, name: newName, path: folderPath }); // no-op

  try {
    await fs.promises.access(newAbs);
    return res.status(409).json({ error: 'Target name already exists' });
  } catch {
    // ok, does not exist
  }

  try {
    await fs.promises.rename(abs, newAbs);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to rename' });
  }

  const parentPosix = folderPath.split('/').slice(0, -1).join('/');
  const newPosix = '/' + [parentPosix.replace(/^\//, ''), newName].filter(Boolean).join('/');
  return res.json({ ok: true, name: newName, path: newPosix });
});

// Delete empty folder
app.delete('/api/admin/folders', requireAdmin, async (req, res) => {
  const folderPath = typeof req.body?.path === 'string' ? req.body.path : '';
  if (!folderPath) return res.status(400).json({ error: 'Missing path' });

  const abs = safeResolveContent(folderPath);
  if (!abs) return res.status(400).json({ error: 'Invalid path' });

  let stat;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!stat.isDirectory()) return res.status(400).json({ error: 'Path is not a directory' });

  try {
    const entries = await fs.promises.readdir(abs);
    if (entries.length > 0) {
      return res.status(409).json({ error: 'Folder is not empty' });
    }
  } catch {
    return res.status(500).json({ error: 'Failed to read folder' });
  }

  try {
    await fs.promises.rmdir(abs);
  } catch {
    return res.status(500).json({ error: 'Failed to delete folder' });
  }

  return res.json({ ok: true });
});

// --- Admin: files CRUD ---
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  }),
  limits: {
    fileSize: 1024 * 1024 * 1024
  }
});

function isAllowedFileByExt(filename) {
  const lower = String(filename || '').toLowerCase();
  return lower.endsWith('.pdf') || lower.endsWith('.mp4');
}

function isAllowedMime(mimetype, filename) {
  const lower = String(mimetype || '').toLowerCase();
  if (filename.toLowerCase().endsWith('.pdf')) return lower === 'application/pdf' || lower === 'application/octet-stream';
  if (filename.toLowerCase().endsWith('.mp4')) return lower.startsWith('video/') || lower === 'application/octet-stream';
  return false;
}

async function dedupeFilePath(dirAbs, baseName) {
  const extIdx = baseName.lastIndexOf('.');
  const name = extIdx > 0 ? baseName.slice(0, extIdx) : baseName;
  const ext = extIdx > 0 ? baseName.slice(extIdx) : '';
  let candidate = path.join(dirAbs, baseName);
  let n = 1;
  while (true) {
    try {
      await fs.promises.access(candidate);
      n += 1;
      candidate = path.join(dirAbs, `${name} (${n})${ext}`);
      if (n > 5000) throw new Error('Too many duplicates');
    } catch {
      return candidate;
    }
  }
}

async function moveFileSafe(src, dest) {
  try {
    await fs.promises.rename(src, dest);
    return;
  } catch (e) {
    if (e && (e.code === 'EXDEV' || e.code === 'EPERM')) {
      // Cross-device or permission rename issue: fallback to copy+unlink
      await fs.promises.copyFile(src, dest);
      await fs.promises.unlink(src);
      return;
    }
    throw e;
  }
}

// Upload file
app.post('/api/admin/files/upload', requireAdmin, upload.single('file'), async (req, res) => {
  const destPath = typeof req.body?.path === 'string' ? req.body.path : '';
  if (!destPath) return res.status(400).json({ error: 'Missing path' });

  const dirAbs = safeResolveContent(destPath);
  if (!dirAbs) return res.status(400).json({ error: 'Invalid path' });

  let dirStat;
  try {
    dirStat = await fs.promises.stat(dirAbs);
  } catch {
    return res.status(404).json({ error: 'Destination not found' });
  }
  if (!dirStat.isDirectory()) return res.status(400).json({ error: 'Destination is not a directory' });

  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Missing file' });

  const original = file.originalname;
  if (!isAllowedFileByExt(original) || !isAllowedMime(file.mimetype, original)) {
    try { await fs.promises.unlink(file.path); } catch {}
    return res.status(415).json({ error: 'Unsupported file type (only PDF and MP4 allowed)' });
  }

  const safeName = path.basename(original);
  let finalAbs;
  try {
    finalAbs = await dedupeFilePath(dirAbs, safeName);
    await moveFileSafe(file.path, finalAbs);
  } catch (e) {
    try { await fs.promises.unlink(file.path); } catch {}
    return res.status(500).json({ error: 'Failed to save file' });
  }

  const relFromDir = path.basename(finalAbs);
  const basePath = destPath.endsWith('/') ? destPath.slice(0, -1) : destPath;
  const filePosix = '/' + [basePath.replace(/^\//, ''), relFromDir].filter(Boolean).join('/');
  return res.status(201).json({ ok: true, name: relFromDir, path: filePosix });
});

// Rename file
app.patch('/api/admin/files/rename', requireAdmin, async (req, res) => {
  const filePath = typeof req.body?.path === 'string' ? req.body.path : '';
  const newName = String(req.body?.newName || '');
  if (!filePath) return res.status(400).json({ error: 'Missing path' });
  if (!isValidName(newName)) return res.status(400).json({ error: 'Invalid file name' });
  if (!isAllowedFileByExt(newName)) return res.status(415).json({ error: 'Unsupported file type' });

  const abs = safeResolveContent(filePath);
  if (!abs) return res.status(400).json({ error: 'Invalid path' });

  let stat;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!stat.isFile()) return res.status(400).json({ error: 'Path is not a file' });

  const parentDir = path.dirname(abs);
  const newAbs = path.join(parentDir, newName);

  try {
    await fs.promises.access(newAbs);
    return res.status(409).json({ error: 'Target name already exists' });
  } catch {}

  try {
    await fs.promises.rename(abs, newAbs);
  } catch {
    return res.status(500).json({ error: 'Failed to rename' });
  }

  const parentPosix = filePath.split('/').slice(0, -1).join('/');
  const newPosix = '/' + [parentPosix.replace(/^\//, ''), newName].filter(Boolean).join('/');
  return res.json({ ok: true, name: newName, path: newPosix });
});

// Delete file
app.delete('/api/admin/files', requireAdmin, async (req, res) => {
  const filePath = typeof req.body?.path === 'string' ? req.body.path : '';
  if (!filePath) return res.status(400).json({ error: 'Missing path' });

  const abs = safeResolveContent(filePath);
  if (!abs) return res.status(400).json({ error: 'Invalid path' });

  let stat;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!stat.isFile()) return res.status(400).json({ error: 'Path is not a file' });

  try {
    await fs.promises.unlink(abs);
  } catch {
    return res.status(500).json({ error: 'Failed to delete file' });
  }

  return res.json({ ok: true });
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



