const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const { listContent } = require('./lib/list');

// Load environment variables from .env if present
dotenv.config();

const PORT = parseInt(process.env.PORT, 10) || 3001;
const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(__dirname, 'content');
const NODE_ENV = process.env.NODE_ENV || 'development';

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

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Modules endpoint
app.get('/api/modules', async (req, res, next) => {
  try {
    const items = await listContent(CONTENT_DIR);
    res.json(items);
  } catch (err) {
    next(err);
  }
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



