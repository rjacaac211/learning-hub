/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const SERVER_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SERVER_DIR, '..');

const RAW_DIR = process.argv.includes('--raw')
  ? path.resolve(process.cwd(), process.argv[process.argv.indexOf('--raw') + 1] || 'raw_files')
  : (process.env.RAW_DIR
      ? path.resolve(process.cwd(), process.env.RAW_DIR)
      : path.resolve(REPO_ROOT, 'raw_files'));

const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(SERVER_DIR, 'content');
const STRUCTURE_MD = path.resolve(REPO_ROOT, 'structure.md');

const SIM_THRESHOLD = 0.65;

const ALIASES = new Map([
  ['shs', 'Senior High School'],
  ['senior high', 'Senior High School'],
  ['senior high school', 'Senior High School'],
  ['jhs', 'Junior High School'],
  ['junior high', 'Junior High School'],
  ['junior high school', 'Junior High School'],
  ['gas', 'General Academic Strand'],
  ['g11', 'Grade 11'],
  ['grade11', 'Grade 11'],
  ['grade 11', 'Grade 11'],
  ['g12', 'Grade 12'],
  ['grade12', 'Grade 12'],
  ['grade 12', 'Grade 12'],
  ['g10', 'Grade 10'],
  ['grade10', 'Grade 10'],
  ['grade 10', 'Grade 10'],
  ['g9', 'Grade 9'],
  ['grade9', 'Grade 9'],
  ['grade 9', 'Grade 9'],
  ['g8', 'Grade 8'],
  ['grade8', 'Grade 8'],
  ['grade 8', 'Grade 8'],
  ['g7', 'Grade 7'],
  ['grade7', 'Grade 7'],
  ['grade 7', 'Grade 7'],
  ['1st sem', '1st Semester'],
  ['first semester', '1st Semester'],
  ['1st semester', '1st Semester'],
  ['2nd sem', '2nd Semester'],
  ['second semester', '2nd Semester'],
  ['2nd semester', '2nd Semester'],
  ['learning materials', 'Learning Materials'],
  ['video lessons', 'Video Lessons']
]);

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function aliasOrSelf(s) {
  const n = normalize(s);
  return ALIASES.get(n) || s;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,        // deletion
        dp[j - 1] + 1,    // insertion
        prev + cost       // substitution
      );
      prev = tmp;
    }
  }
  return dp[n];
}

function similarity(a, b) {
  const an = normalize(a);
  const bn = normalize(b);
  if (!an && !bn) return 1;
  if (!an || !bn) return 0;
  const dist = levenshtein(an, bn);
  const maxLen = Math.max(an.length, bn.length);
  return 1 - dist / maxLen;
}

function parseStructureMd(content) {
  const lines = content.split(/\r?\n/);
  const stack = [];
  const paths = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '    ');
    let marker = '├── ';
    let idx = line.indexOf(marker);
    if (idx === -1) {
      marker = '└── ';
      idx = line.indexOf(marker);
    }
    if (idx === -1) continue;
    const lead = line.slice(0, idx).replace(/│/g, ' ');
    const numSpaces = (lead.match(/ /g) || []).length;
    const depth = Math.floor(numSpaces / 4);

    let name = line.slice(idx + marker.length);
    const hashIdx = name.indexOf('#');
    if (hashIdx !== -1) name = name.slice(0, hashIdx);
    name = name.trim();
    if (!name) continue;

    while (stack.length > depth) stack.pop();
    stack[depth] = name;
    const parts = stack.slice(0, depth + 1).filter(Boolean);
    if (parts.length) paths.push(parts);
  }
  return paths;
}

function buildTree(paths) {
  const root = { name: '', children: new Map() };
  for (const parts of paths) {
    let node = root;
    for (const part of parts) {
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, children: new Map() });
      }
      node = node.children.get(part);
    }
  }
  return root;
}

function findBestChild(node, rawPart) {
  const candidates = Array.from(node.children.values());
  const aliased = aliasOrSelf(rawPart);
  let best = null;
  let bestScore = -1;
  for (const child of candidates) {
    const score = Math.max(similarity(aliased, child.name), similarity(rawPart, child.name));
    if (score > bestScore) {
      bestScore = score;
      best = child;
    }
  }
  return { best, bestScore };
}

function isLikeLearningMaterials(part) {
  const s = similarity(part, 'Learning Materials');
  return s >= 0.7;
}

function isLikeVideoLessons(part) {
  const s = similarity(part, 'Video Lessons');
  return s >= 0.7;
}

function isLikeQuarter(part) {
  const p = normalize(part);
  if (!p) return false;
  if (/^quarter\s*\d+$/i.test(part)) return true;
  if (/^q[1-4]$/i.test(part)) return true;
  return false;
}

async function* walkDir(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const d of dirents) {
    if (d.name.startsWith('.')) continue;
    const abs = path.resolve(dir, d.name);
    if (d.isDirectory()) {
      yield* walkDir(abs);
    } else if (d.isFile()) {
      yield abs;
    }
  }
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
      // exists, try next
      const nextName = `${base} (${i})${ext}`;
      dest = path.resolve(destDir, nextName);
      i += 1;
    } catch {
      break;
    }
  }
  await fs.promises.rename(src, dest);
  return dest;
}

async function main() {
  const logPath = path.resolve(SERVER_DIR, 'import-pdfs.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  function log(line) {
    const ts = new Date().toISOString();
    logStream.write(`[${ts}] ${line}\n`);
  }

  console.log(`RAW_DIR: ${RAW_DIR}`);
  console.log(`CONTENT_DIR: ${CONTENT_DIR}`);
  console.log(`Reading structure from: ${STRUCTURE_MD}`);

  let md;
  try {
    md = await fs.promises.readFile(STRUCTURE_MD, 'utf8');
  } catch (e) {
    console.error('Unable to read structure.md:', e.message);
    process.exit(1);
  }

  const paths = parseStructureMd(md);
  const tree = buildTree(paths);

  let moved = 0;
  let skipped = 0;

  // Walk all files in RAW_DIR
  for await (const absFile of walkDir(RAW_DIR)) {
    const ext = path.extname(absFile).toLowerCase();
    if (ext !== '.pdf') continue;

    const rel = path.relative(RAW_DIR, absFile);
    const parts = rel.split(path.sep);
    const dirParts = parts.slice(0, -1);
    const fileName = parts[parts.length - 1];

    // Skip if the path indicates "Video Lessons"
    if (dirParts.some(p => isLikeVideoLessons(p))) {
      log(`SKIP: ${rel} (in Video Lessons)`);
      skipped += 1;
      continue;
    }

    // Remove "Learning Materials" segment if present; we want the subject path
    // Also drop quarter folders (Quarter 1..4, Q1..Q4) which live under Learning Materials
    const subjectParts = dirParts.filter(p => !isLikeLearningMaterials(p) && !isLikeQuarter(p));

    // Greedy mapping along canonical tree
    let node = tree;
    const mapped = [];
    let ok = true;
    for (const rawSeg of subjectParts) {
      const { best, bestScore } = findBestChild(node, rawSeg);
      if (!best || bestScore < SIM_THRESHOLD) {
        ok = false;
        log(`SKIP: ${rel} (low-confidence match for segment "${rawSeg}" score=${bestScore?.toFixed(2)})`);
        break;
      }
      mapped.push(best.name);
      node = best;
    }
    if (!ok) {
      skipped += 1;
      continue;
    }

    // Require Learning Materials child
    const lmChild = node.children.get('Learning Materials');
    if (!lmChild) {
      log(`SKIP: ${rel} (no Learning Materials under "${mapped.join(' / ')}")`);
      skipped += 1;
      continue;
    }

    const destDir = path.resolve(CONTENT_DIR, ...mapped, 'Learning Materials');
    try {
      const movedTo = await moveWithDedup(absFile, destDir, fileName);
      log(`MOVED: ${rel} -> ${path.relative(CONTENT_DIR, movedTo).replace(/\\/g, '/')}`);
      moved += 1;
    } catch (e) {
      log(`SKIP: ${rel} (error moving: ${e.message})`);
      skipped += 1;
    }
  }

  log(`SUMMARY: moved=${moved}, skipped=${skipped}`);
  logStream.end();
  console.log(`Import complete. Moved: ${moved}, Skipped: ${skipped}. See log at ${path.relative(REPO_ROOT, logPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


