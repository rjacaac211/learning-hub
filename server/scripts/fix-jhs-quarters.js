/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const SERVER_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SERVER_DIR, '..');
const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(SERVER_DIR, 'content');

const LOG_PATH = process.argv.includes('--log')
  ? path.resolve(process.cwd(), process.argv[process.argv.indexOf('--log') + 1])
  : path.resolve(SERVER_DIR, 'import-pdfs.log');

const DRY_RUN = process.argv.includes('--dry');

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function detectQuarterFrom(text) {
  const s = normalize(text);
  // Prefer explicit "quarter X"
  const m = s.match(/quarter\s*([1-4])/i);
  if (m) return `Quarter ${m[1]}`;
  // Try Q1..Q4 tokens
  const q = s.match(/\bq([1-4])\b/i);
  if (q) return `Quarter ${q[1]}`;
  return null;
}

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function moveWithDedup(src, destDir, fileName) {
  await ensureDir(destDir);
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let dest = path.resolve(destDir, fileName);
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fs.promises.access(dest, fs.constants.F_OK);
      const nextName = `${base} (${i})${ext}`;
      dest = path.resolve(destDir, nextName);
      i += 1;
    } catch {
      break;
    }
  }
  if (!DRY_RUN) {
    await fs.promises.rename(src, dest);
  }
  return dest;
}

function parseMovedLines(logContent) {
  const lines = logContent.split(/\r?\n/);
  const moved = [];
  for (const line of lines) {
    // Example: [ISO] MOVED: <relFrom> -> <relTo>
    const idx = line.indexOf('MOVED:');
    if (idx === -1) continue;
    const rest = line.slice(idx + 'MOVED:'.length).trim();
    const arrow = rest.indexOf('->');
    if (arrow === -1) continue;
    const relFrom = rest.slice(0, arrow).trim();
    const relTo = rest.slice(arrow + 2).trim();
    if (!relFrom || !relTo) continue;
    moved.push({ relFrom, relTo });
  }
  return moved;
}

function isJhsLearningMaterialsFile(relTo) {
  // POSIX-style in log: starts with "Junior High School/" and includes "/Learning Materials/"
  return (
    relTo.startsWith('Junior High School/') &&
    relTo.includes('/Learning Materials/')
  );
}

function parentLearningMaterialsDirAbs(relTo) {
  // relTo like: Junior High School/.../Subject/Learning Materials/filename.pdf
  const parts = relTo.split('/');
  const idx = parts.lastIndexOf('Learning Materials');
  if (idx === -1) return null;
  const lmParts = parts.slice(0, idx + 1);
  const lmRel = lmParts.join('/');
  return path.resolve(CONTENT_DIR, lmRel);
}

async function main() {
  const fixLogPath = path.resolve(SERVER_DIR, 'fix-jhs-quarters.log');
  const logStream = fs.createWriteStream(fixLogPath, { flags: 'a' });
  function log(line) {
    const ts = new Date().toISOString();
    logStream.write(`[${ts}] ${line}\n`);
  }

  console.log(`Reading import log: ${LOG_PATH}`);
  console.log(`CONTENT_DIR: ${CONTENT_DIR}`);
  console.log(`Dry run: ${DRY_RUN ? 'YES' : 'NO'}`);

  let logContent;
  try {
    logContent = await fs.promises.readFile(LOG_PATH, 'utf8');
  } catch (e) {
    console.error('Unable to read log file:', e.message);
    process.exit(1);
  }

  const moved = parseMovedLines(logContent);
  let fixed = 0;
  let skipped = 0;

  for (const { relFrom, relTo } of moved) {
    if (!isJhsLearningMaterialsFile(relTo)) {
      continue;
    }

    // Skip if file already in a Quarter folder
    if (/\/Learning Materials\/Quarter\s*[1-4]\//i.test(relTo)) {
      continue;
    }

    const quarter = detectQuarterFrom(relFrom) || detectQuarterFrom(path.basename(relFrom));
    if (!quarter) {
      log(`SKIP: ${relTo} (no quarter inferred from "${relFrom}")`);
      skipped += 1;
      continue;
    }

    const destFileAbs = path.resolve(CONTENT_DIR, relTo);
    let stat;
    try {
      stat = await fs.promises.stat(destFileAbs);
      if (!stat.isFile()) throw new Error('not a file');
    } catch {
      log(`SKIP: ${relTo} (destination file not found)`);
      skipped += 1;
      continue;
    }

    const lmDirAbs = parentLearningMaterialsDirAbs(relTo);
    if (!lmDirAbs) {
      log(`SKIP: ${relTo} (could not locate Learning Materials directory)`);
      skipped += 1;
      continue;
    }

    const quarterDirAbs = path.resolve(lmDirAbs, quarter);
    try {
      const movedTo = await moveWithDedup(destFileAbs, quarterDirAbs, path.basename(destFileAbs));
      log(`FIXED: ${relTo} -> ${path.relative(CONTENT_DIR, movedTo).replace(/\\/g, '/')}`);
      fixed += 1;
    } catch (e) {
      log(`SKIP: ${relTo} (error moving to ${quarter}: ${e.message})`);
      skipped += 1;
    }
  }

  log(`SUMMARY: fixed=${fixed}, skipped=${skipped}`);
  logStream.end();
  console.log(`Done. Fixed: ${fixed}, Skipped: ${skipped}. See ${path.relative(REPO_ROOT, fixLogPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


