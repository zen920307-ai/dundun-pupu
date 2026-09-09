/** Start the built worker locally and snapshot HTML for GitHub Pages. */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PORT = 8788;
const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'dist', 'client');
const ROUTES = ['/', '/kv', '/wallpapers', '/travel'];

function destFor(route) {
  return route === '/'
    ? join(OUT, 'index.html')
    : join(OUT, route.slice(1), 'index.html');
}

function rewriteImages(html) {
  return html.replace(
    /\/_next\/image\?url=([^"'&]+)[^"']*/g,
    (_, enc) => decodeURIComponent(enc),
  );
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + '/');
      if (res.ok || res.status === 404) return;
    } catch {
      /* still booting */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('wrangler did not start');
}

const wrangler = spawn(
  'npx',
  [
    'wrangler',
    'dev',
    '--config',
    'dist/server/wrangler.json',
    '--port',
    String(PORT),
    '--ip',
    '127.0.0.1',
  ],
  { cwd: ROOT, stdio: 'pipe', shell: true },
);
wrangler.stdout.on('data', (d) => process.stdout.write(d));
wrangler.stderr.on('data', (d) => process.stderr.write(d));

try {
  await waitForServer();
  for (const route of ROUTES) {
    const res = await fetch('http://127.0.0.1:' + PORT + route);
    const html = rewriteImages(await res.text());
    const file = destFor(route);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    console.log('wrote', file, res.status);
  }
  copyFileSync(join(OUT, 'index.html'), join(OUT, '404.html'));
  if (!existsSync(join(OUT, '.nojekyll'))) writeFileSync(join(OUT, '.nojekyll'), '');
  if (!existsSync(join(OUT, 'CNAME')))
    writeFileSync(join(OUT, 'CNAME'), 'dun.zenslab.top\n');
} finally {
  wrangler.kill();
}
