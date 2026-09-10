// ============================================================
// 本地内容后台服务 —— node admin-local/server.mjs（或 npm run admin）
// 只监听 127.0.0.1，仅本机可访问；数据写入 content/*.json，
// 「保存并发布」自动 git commit + push，GitHub Pages 约 1~3 分钟后更新。
// ============================================================
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const MEDIA_DIR = path.join(ROOT, 'public', 'cms-media');
const PORT = 4321;
const GIT_BRANCH = 'master';

// ---------- 模块与字段定义 ----------
const MODULES = {
  kv: {
    label: '主视觉 KV',
    prefix: 'kv',
    fields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'tag', label: '标签 / 主题', type: 'text' },
      { key: 'src', label: '展示图', type: 'image' },
      { key: 'thumb', label: '缩略图（列表用）', type: 'image' },
      { key: 'original', label: '原图（下载用，可空）', type: 'image' },
      { key: 'width', label: '宽 px', type: 'number' },
      { key: 'height', label: '高 px', type: 'number' },
    ],
  },
  wallpapers: {
    label: '手机壁纸',
    prefix: 'wallpaper',
    fields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'tag', label: '标签 / 主题', type: 'text' },
      { key: 'src', label: '展示图', type: 'image' },
      { key: 'thumb', label: '缩略图（列表用）', type: 'image' },
      { key: 'original', label: '原图（下载用，可空）', type: 'image' },
      { key: 'width', label: '宽 px', type: 'number' },
      { key: 'height', label: '高 px', type: 'number' },
    ],
  },
  festivals: {
    label: '可爱设计',
    prefix: 'festival',
    fields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'tag', label: '标签 / 主题', type: 'text' },
      { key: 'src', label: '展示图', type: 'image' },
      { key: 'thumb', label: '缩略图（列表用）', type: 'image' },
      { key: 'original', label: '原图（下载用，可空）', type: 'image' },
      { key: 'width', label: '宽 px', type: 'number' },
      { key: 'height', label: '高 px', type: 'number' },
    ],
  },
  emoji: {
    label: '表情包',
    prefix: 'emoji',
    fields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'tag', label: '标签 / 主题', type: 'text' },
      { key: 'src', label: '展示图', type: 'image' },
      { key: 'thumb', label: '缩略图（列表用）', type: 'image' },
      { key: 'width', label: '宽 px', type: 'number' },
      { key: 'height', label: '高 px', type: 'number' },
    ],
  },
  travel: {
    label: '出逃档案',
    prefix: 'trip',
    fields: [
      { key: 'id', label: '档案编号（英文拼音，页面锚点用，不可重复）', type: 'text' },
      { key: 'place', label: '地点', type: 'text' },
      { key: 'route', label: '路线', type: 'text' },
      { key: 'date', label: '日期（如 2026.08）', type: 'text' },
      { key: 'mode', label: '出行方式', type: 'text' },
      { key: 'tag', label: '标签', type: 'text' },
      { key: 'title', label: '标题', type: 'text' },
      { key: 'story', label: '日记正文（每行一段）', type: 'textarea' },
      { key: 'talk', label: '损友小剧场（每行一句，如「墩墩：……」）', type: 'textarea' },
      { key: 'receipt', label: '账单 / 战利品（一行）', type: 'text' },
      { key: 'poster', label: '完整海报（不传则走 /travel/地点.webp）', type: 'image' },
      { key: 'posterThumb', label: '海报缩略图（不传则走约定路径）', type: 'image' },
    ],
  },
};

// ---------- 工具 ----------
const jsonFile = (module) => path.join(CONTENT_DIR, `${module}.json`);

async function readModule(module) {
  return JSON.parse(await fs.readFile(jsonFile(module), 'utf8'));
}

async function writeModule(module, items) {
  await fs.writeFile(jsonFile(module), JSON.stringify(items, null, 2) + '\n', 'utf8');
}

function gitExec(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd: ROOT, windowsHide: true, timeout: 120000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, output: ((stdout || '') + (stderr || '')).trim() });
    });
  });
}

// ---------- API ----------
async function handleApi(req, res, url) {
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  };
  const body = () =>
    new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });

  try {
    // 模块字段定义
    if (url.pathname === '/api/schema') {
      const schema = Object.fromEntries(
        Object.entries(MODULES).map(([k, m]) => [k, { label: m.label, fields: m.fields, prefix: m.prefix }]),
      );
      return send(200, { ok: true, schema });
    }

    // 读取模块数据
    if (url.pathname === '/api/data' && req.method === 'GET') {
      const module = url.searchParams.get('module');
      if (!MODULES[module]) return send(400, { ok: false, error: '未知模块' });
      return send(200, { ok: true, items: await readModule(module) });
    }

    // 保存模块数据（整表覆盖）
    if (url.pathname === '/api/save' && req.method === 'POST') {
      const { module, items } = await body();
      if (!MODULES[module] || !Array.isArray(items)) return send(400, { ok: false, error: '参数错误' });
      await writeModule(module, items);
      return send(200, { ok: true, message: `已保存 ${items.length} 条到 content/${module}.json` });
    }

    // 上传媒体：请求体为原始文件字节，文件名放 x-file-name 头
    if (url.pathname === '/api/upload' && req.method === 'POST') {
      const module = url.searchParams.get('module');
      const fileName = decodeURIComponent(req.headers['x-file-name'] || 'file');
      if (!MODULES[module]) return send(400, { ok: false, error: '未知模块' });
      const dir = path.join(MEDIA_DIR, module);
      await fs.mkdir(dir, { recursive: true });
      const safeName = fileName.replace(/[\\/:*?"<>|]/g, '_');
      const fileNameOut = `${Date.now()}-${safeName}`;
      const chunks = [];
      for await (const c of req) chunks.push(c);
      await fs.writeFile(path.join(dir, fileNameOut), Buffer.concat(chunks));
      const webPath = `/cms-media/${module}/${fileNameOut}`;
      return send(200, { ok: true, path: webPath });
    }

    // 发布：git add + commit + push
    if (url.pathname === '/api/publish' && req.method === 'POST') {
      const { message } = await body().catch(() => ({ message: '' }));
      const add = await gitExec('git add -A');
      if (!add.ok) return send(500, { ok: false, error: 'git add 失败：' + add.output });
      const status = await gitExec('git status --porcelain');
      if (!status.output.trim()) {
        return send(200, { ok: true, message: '没有需要发布的改动（云端已是最新）' });
      }
      const commitMsg = (message || `内容更新 ${new Date().toLocaleString('zh-CN')}`).replace(/"/g, "'");
      const commit = await gitExec(`git commit -m "${commitMsg}"`);
      if (!commit.ok) return send(500, { ok: false, error: 'git commit 失败：' + commit.output });
      const push = await gitExec(`git push origin ${GIT_BRANCH}`);
      if (!push.ok) return send(500, { ok: false, error: 'git push 失败：' + push.output });
      return send(200, {
        ok: true,
        message: `已推送，GitHub Pages 约 1~3 分钟后更新。${push.output.slice(-200)}`,
      });
    }

    send(404, { ok: false, error: 'not found' });
  } catch (e) {
    send(500, { ok: false, error: String(e && e.message ? e.message : e) });
  }
}

// ---------- 静态页 ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
};

async function handleStatic(res, url) {
  // 站点 public 资源（列表缩略图、已上传媒体等）直接托管
  if (url.pathname.startsWith('/cms-media/') || url.pathname.startsWith('/gallery/') || url.pathname.startsWith('/travel/') || url.pathname.startsWith('/media/') || url.pathname.startsWith('/downloads/')) {
    const asset = path.resolve(ROOT, 'public', decodeURIComponent(url.pathname.slice(1)).replace(/^public\//, ''));
    const publicDir = path.resolve(ROOT, 'public');
    if (asset.startsWith(publicDir)) {
      try {
        const data = await fs.readFile(asset);
        res.writeHead(200, { 'Content-Type': MIME[path.extname(asset)] || 'application/octet-stream' });
        return res.end(data);
      } catch {
        res.writeHead(404);
        return res.end('not found');
      }
    }
  }
  const file = url.pathname === '/' || url.pathname === '/admin' ? 'admin.html' : url.pathname.slice(1);
  const full = path.resolve(__dirname, file);
  if (!full.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('forbidden');
  }
  try {
    const data = await fs.readFile(full);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404');
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  return handleStatic(res, url);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('内容后台已启动：http://127.0.0.1:%s （Ctrl+C 关闭；只监听本机，外部无法访问）', PORT);
});
