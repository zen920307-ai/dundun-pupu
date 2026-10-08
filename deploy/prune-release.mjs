import { readFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2]);
if (!/^\/srv\/dundun-pupu\/releases\/release-\d+$/.test(root)) throw new Error('Invalid release directory');
const files = JSON.parse(await readFile(path.join(root, '.deployment-manifest.json'), 'utf8'));
async function prune(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) await prune(path.join(directory, entry.name), relative + '/');
    else if (relative !== '.deployment-manifest.json' && !Object.hasOwn(files, relative)) await unlink(path.join(directory, entry.name));
  }
}
await prune(root);
