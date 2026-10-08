import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.argv[2] || 'http://127.0.0.1:4398';
for (const route of ['/', '/kv', '/wallpapers', '/travel']) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  assert.match(await response.text(), /墩墩/);
}
const assets = new Set(['/media/intro-enhanced-1080.mp4', '/media/poster-enhanced.webp', '/favicon.png', '/fonts/duo-mochi.woff2', '/fonts/duo-round.woff2', '/media/footer-brand-dundun.webp', '/media/footer-brand-amp.webp', '/media/footer-brand-pupu.webp']);
function collect(value) {
  if (typeof value === 'string' && /^\/(gallery|travel|media|cms-media|downloads)\//.test(value)) assets.add(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
}
for (const module of ['kv', 'wallpapers', 'festivals', 'emoji', 'travel']) {
  collect(JSON.parse(await readFile(new URL(`../content/${module}.json`, import.meta.url), 'utf8')));
}
for (const asset of assets) {
  const response = await fetch(base + encodeURI(asset), { method: 'HEAD' });
  assert.equal(response.status, 200, asset);
}
const range = await fetch(base + '/media/intro-enhanced-1080.mp4', { headers: { Range: 'bytes=0-1023' } });
assert.equal(range.status, 206, 'Video seeking');
assert.equal((await range.arrayBuffer()).byteLength, 1024);
assert.equal((await fetch(base + '/missing-asset.webp')).status, 404);
assert.equal((await fetch(base + '/api/publish', { method: 'POST' })).status, 404, 'Local admin must stay private');
console.log(`Verified 4 routes, ${assets.size} assets, video range requests and private admin: ${base}`);
