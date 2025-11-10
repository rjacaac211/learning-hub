/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env for CONTENT_DIR
dotenv.config();

const SERVER_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SERVER_DIR, '..');
const STRUCTURE_MD = path.resolve(REPO_ROOT, 'structure.md');
const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(SERVER_DIR, 'content');

/**
 * Parse a tree-like markdown (lines with ├── / └──) into an array of path arrays.
 * Only lines containing the markers are considered directories to create.
 */
function parseStructureMd(content) {
  const lines = content.split(/\r?\n/);
  const stack = [];
  const paths = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '    '); // normalize tabs to spaces

    // Find marker
    let marker = '├── ';
    let idx = line.indexOf(marker);
    if (idx === -1) {
      marker = '└── ';
      idx = line.indexOf(marker);
    }
    if (idx === -1) continue; // ignore lines without a marker

    // Determine depth by counting leading spaces (treat │ as space)
    const lead = line.slice(0, idx).replace(/│/g, ' ');
    const numSpaces = (lead.match(/ /g) || []).length;
    const depth = Math.floor(numSpaces / 4);

    // Extract name
    let name = line.slice(idx + marker.length);
    // Remove inline comments like " # contains ..."
    const hashIdx = name.indexOf('#');
    if (hashIdx !== -1) {
      name = name.slice(0, hashIdx);
    }
    name = name.trim();
    if (!name) continue;

    // Adjust stack to current depth
    while (stack.length > depth) stack.pop();
    stack[depth] = name;

    const parts = stack.slice(0, depth + 1).filter(Boolean);
    if (parts.length) {
      paths.push(parts);
    }
  }

  return paths;
}

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function main() {
  console.log(`Reading structure from: ${STRUCTURE_MD}`);
  let md;
  try {
    md = await fs.promises.readFile(STRUCTURE_MD, 'utf8');
  } catch (e) {
    console.error('Unable to read structure.md:', e.message);
    process.exit(1);
  }

  const paths = parseStructureMd(md);
  console.log(`Found ${paths.length} directories to ensure.`);

  await ensureDir(CONTENT_DIR);

  let created = 0;
  for (const parts of paths) {
    const abs = path.resolve(CONTENT_DIR, ...parts);
    try {
      await ensureDir(abs);
      created += 1;

      // Create placeholder files for specific leaf directories
      const leaf = parts[parts.length - 1];
      if (leaf === 'Learning Materials') {
        const placeholder = path.join(abs, 'placeholder.txt');
        try {
          await fs.promises.access(placeholder, fs.constants.F_OK);
        } catch {
          await fs.promises.writeFile(
            placeholder,
            'Place PDF learning materials in this folder.\nThis is a placeholder file.',
            'utf8'
          );
        }
      }
      if (leaf === 'Video Lessons') {
        const placeholder = path.join(abs, 'placeholder.txt');
        try {
          await fs.promises.access(placeholder, fs.constants.F_OK);
        } catch {
          await fs.promises.writeFile(
            placeholder,
            'Place video lesson files in this folder.\nThis is a placeholder file.',
            'utf8'
          );
        }
      }
    } catch (e) {
      console.warn(`Failed to create: ${abs}`, e.message);
    }
  }

  console.log(`Sync complete. Ensured ${created} directories under ${CONTENT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



