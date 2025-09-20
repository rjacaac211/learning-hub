const fs = require('fs');
const path = require('path');
const { posix } = path;
const { lookup: lookupMime } = require('mime-types');

/**
 * Recursively list files under a content root directory, returning
 * an array of objects: { name, rel, size, mime, breadcrumbs }
 * - Uses POSIX separators for rel paths
 * - Skips dotfiles and hidden directories
 * - Computes simple breadcrumbs string like "english / reading / grade7"
 * @param {string} root
 * @returns {Promise<Array<{name:string, rel:string, size:number, mime:string|null, breadcrumbs:string}>>}
 */
async function listContent(root) {
  const entries = [];

  async function walk(currentAbs, currentRelParts) {
    const dirents = await fs.promises.readdir(currentAbs, { withFileTypes: true });
    for (const dirent of dirents) {
      const name = dirent.name;
      // Skip dotfiles and hidden directories
      if (name.startsWith('.')) continue;

      const absPath = path.join(currentAbs, name);
      const relParts = [...currentRelParts, name];

      if (dirent.isDirectory()) {
        await walk(absPath, relParts);
      } else if (dirent.isFile()) {
        let stat;
        try {
          stat = await fs.promises.stat(absPath);
        } catch (e) {
          continue;
        }
        const relPosix = '/' + posix.join(...relParts);
        const mime = lookupMime(name) || null;
        const breadcrumbs = relParts
          .slice(0, Math.max(1, relParts.length - 1))
          .join(' / ')
          .toLowerCase();
        entries.push({
          name,
          rel: relPosix,
          size: stat.size,
          mime,
          breadcrumbs
        });
      }
    }
  }

  // Ensure categories exist gracefully; if not, return empty array
  try {
    const initial = await fs.promises.readdir(root, { withFileTypes: true });
    // Walk only english, math, science if present; otherwise walk everything non-hidden
    const preferred = new Set(['english', 'math', 'science']);
    const toWalk = initial.filter(d => d.isDirectory() && !d.name.startsWith('.'));
    const ordered = [
      ...toWalk.filter(d => preferred.has(d.name.toLowerCase())),
      ...toWalk.filter(d => !preferred.has(d.name.toLowerCase()))
    ];
    for (const dirent of ordered) {
      await walk(path.join(root, dirent.name), [dirent.name]);
    }
  } catch (e) {
    // If root is missing, return empty list
    return [];
  }

  return entries;
}

module.exports = { listContent };



