/** Start the built worker locally and snapshot HTML for GitHub Pages. */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PORT = 8788;
const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'dist', 'client');
const ROUTES = ['/', '/kv', '/wallpapers', '/travel'];
const REQ_TIMEOUT = 30_000; // 单请求超时：CI 里 wrangler 偶发挂请求（workers-sdk#7635），不能无限等
const MAX_ATTEMPTS = 4;

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

function startWrangler(debug) {
  const args = [
    'wrangler',
    'dev',
    '--config',
    'dist/server/wrangler.json',
    '--port',
    String(PORT),
    '--ip',
    '127.0.0.1',
  ];
  if (debug) args.push('--log-level', 'debug');
  const child = spawn('npx', args, {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  return child;
}

function stopWrangler(child) {
  if (!child || child.exitCode != null) return;
  child.kill('SIGTERM');
  if (child.pid && process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  }
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + '/', { signal: AbortSignal.timeout(5000) });
      if (res.ok || res.status === 404) return;
    } catch {
      /* still booting */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('wrangler did not start');
}

let wrangler = null;

async function restartWrangler(debug) {
  stopWrangler(wrangler);
  await new Promise((r) => setTimeout(r, 1500));
  wrangler = startWrangler(debug);
  await waitForServer();
}

// 抓一个路由：失败自动重启 wrangler 重试（首次重试开 debug 日志，社区验证可缓解 CI 挂死）
async function fetchRoute(route) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + route, { signal: AbortSignal.timeout(REQ_TIMEOUT) });
      if (res.ok || res.status === 404) return res;
      throw new Error('HTTP ' + res.status);
    } catch (e) {
      lastErr = e;
      console.log(`route ${route} 第 ${attempt}/${MAX_ATTEMPTS} 次尝试失败：${e.message || e}`);
      const isLast = attempt === MAX_ATTEMPTS;
      if (!isLast) await restartWrangler(attempt === 1);
    }
  }
  throw lastErr;
}

// 总看门狗：绝不无限挂起
const watchdog = setTimeout(() => {
  console.error('prerender 总超时（5 分钟），强制失败以便排查');
  stopWrangler(wrangler);
  process.exit(1);
}, 5 * 60_000);

try {
  wrangler = startWrangler(false);
  await waitForServer();
  for (const route of ROUTES) {
    const res = await fetchRoute(route);
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
  clearTimeout(watchdog);
} finally {
  stopWrangler(wrangler);
}
