// ============================================================
// 本地内容后台服务 —— node admin-local/server.mjs（或 npm run admin）
// 只监听 127.0.0.1，仅本机可访问；数据写入 content/*.json，
// 「保存并发布」自动 git commit + push，GitHub Pages 约 1~3 分钟后更新。
// ============================================================
import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
      { key: 'src', label: '图片', type: 'image' },
      { key: 'thumb', label: '缩略图', type: 'image', auto: true },
      { key: 'original', label: '原图', type: 'image', auto: true },
      { key: 'width', label: '宽 px', type: 'number', auto: true },
      { key: 'height', label: '高 px', type: 'number', auto: true },
    ],
  },
  wallpapers: {
    label: '手机壁纸',
    prefix: 'wallpaper',
    fields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'tag', label: '标签 / 主题', type: 'text' },
      { key: 'src', label: '图片', type: 'image' },
      { key: 'thumb', label: '缩略图', type: 'image', auto: true },
      { key: 'original', label: '原图', type: 'image', auto: true },
      { key: 'width', label: '宽 px', type: 'number', auto: true },
      { key: 'height', label: '高 px', type: 'number', auto: true },
    ],
  },
  festivals: {
    label: '可爱设计',
    prefix: 'festival',
    fields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'tag', label: '标签 / 主题', type: 'text' },
      { key: 'src', label: '图片', type: 'image' },
      { key: 'thumb', label: '缩略图', type: 'image', auto: true },
      { key: 'original', label: '原图', type: 'image', auto: true },
      { key: 'width', label: '宽 px', type: 'number', auto: true },
      { key: 'height', label: '高 px', type: 'number', auto: true },
    ],
  },
  emoji: {
    label: '表情包',
    prefix: 'emoji',
    fields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'tag', label: '标签 / 主题', type: 'text' },
      { key: 'src', label: '图片', type: 'image' },
      { key: 'thumb', label: '缩略图', type: 'image', auto: true },
      { key: 'width', label: '宽 px', type: 'number', auto: true },
      { key: 'height', label: '高 px', type: 'number', auto: true },
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
      { key: 'poster', label: '海报（上传一张即可，缩略图自动生成）', type: 'image' },
      { key: 'posterThumb', label: '海报缩略图', type: 'image', auto: true },
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

// 长耗时命令（构建/部署）；剥离 NODE_OPTIONS，避免外部注入的 require 钩子干扰构建
const CF_WORKER_NAME = 'dundun-pupu'; // dun.zenslab.top 绑定的 Worker
function runCmd(cmd, timeoutMs = 300000) {
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  return new Promise((resolve) => {
    exec(cmd, { cwd: ROOT, windowsHide: true, timeout: timeoutMs, env }, (err, stdout, stderr) => {
      resolve({ ok: !err, output: ((stdout || '') + (stderr || '')).trim() });
    });
  });
}

// ---------- 图片变体生成（一张图 → 主图 webp + 缩略图 webp） ----------
let pythonCmd = null;
async function findPython() {
  if (pythonCmd) return pythonCmd;
  const candidates = ['C:\\Program Files\\Python312\\python.exe', 'python', 'python3'];
  for (const cmd of candidates) {
    const r = await new Promise((resolve) => {
      exec(`"${cmd}" -c "import PIL"`, { windowsHide: true, timeout: 30000 }, (err) => resolve(!err));
    });
    if (r) {
      pythonCmd = cmd;
      return cmd;
    }
  }
  return null;
}

const MAIN_MAX = 1600; // 主图（展示图/海报）最大宽
const THUMB_MAX = 640; // 缩略图最大宽

async function generateVariants(dir, originalFile, baseName) {
  const py = await findPython();
  if (!py) {
    return { ok: false, error: '未找到带 Pillow 的 Python，无法自动生成格式' };
  }
  const genScript = path.join(__dirname, 'genimg.py');
  const cmd = `"${py}" -X utf8 "${genScript}" "${originalFile}" "${dir}" "${baseName}" ${MAIN_MAX} ${THUMB_MAX}`;
  return new Promise((resolve) => {
    exec(cmd, { windowsHide: true, timeout: 120000, cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        resolve({ ok: false, error: '生成图片变体失败：' + (stderr || err.message).slice(-300) });
        return;
      }
      try {
        const line = stdout.trim().split('\n').pop();
        resolve({ ok: true, ...JSON.parse(line) });
      } catch (e) {
        resolve({ ok: false, error: '解析生成结果失败：' + String(stdout).slice(-200) });
      }
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
    // 一张图自动生成全套格式：原图保留 + 主图 webp + 缩略图 webp，并回报主图尺寸
    if (url.pathname === '/api/upload' && req.method === 'POST') {
      const module = url.searchParams.get('module');
      const fileName = decodeURIComponent(req.headers['x-file-name'] || 'file');
      if (!MODULES[module]) return send(400, { ok: false, error: '未知模块' });
      const dir = path.join(MEDIA_DIR, module);
      await fs.mkdir(dir, { recursive: true });
      const safeName = fileName.replace(/[\\/:*?"<>|]/g, '_');
      const baseName = `${Date.now()}-${safeName.replace(/\.[^.]+$/, '')}`;
      const ext = (safeName.match(/\.[^.]+$/) || ['.png'])[0].toLowerCase();
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const originalOut = path.join(dir, `${baseName}-original${ext}`);
      await fs.writeFile(originalOut, Buffer.concat(chunks));
      const gen = await generateVariants(dir, originalOut, baseName);
      return send(200, {
        ok: true,
        original: `/cms-media/${module}/${path.basename(originalOut)}`,
        ...(gen.ok
          ? { main: `/cms-media/${module}/${gen.main}`, thumb: `/cms-media/${module}/${gen.thumb}`, width: gen.width, height: gen.height }
          : { main: `/cms-media/${module}/${path.basename(originalOut)}`, thumb: '', warning: gen.error + '，已直接使用原图' }),
      });
    }

    // 发布：git 存档 + 本地构建 + wrangler 部署到 Cloudflare Worker（约 1 分钟后线上生效）
    if (url.pathname === '/api/publish' && req.method === 'POST') {
      const { message } = await body().catch(() => ({ message: '' }));
      // 1. git 存档（有改动才提交；推送失败不阻塞上线）
      await gitExec('git add -A');
      const status = await gitExec('git status --porcelain');
      let archiveNote = '无内容改动，跳过 git 存档';
      if (status.output.trim()) {
        const commitMsg = (message || `内容更新 ${new Date().toLocaleString('zh-CN')}`).replace(/"/g, "'");
        const commit = await gitExec(`git commit -m "${commitMsg}"`);
        if (!commit.ok) return send(500, { ok: false, error: 'git commit 失败：' + commit.output });
        const push = await gitExec(`git push origin ${GIT_BRANCH}`);
        archiveNote = push.ok ? '已推送 GitHub 存档' : 'GitHub 推送失败（不影响上线）：' + push.output.slice(-120);
      }
      // 2. 构建（vinext build）
      const build = await runCmd('npm run build', 300000);
      if (!build.ok) return send(500, { ok: false, error: '构建失败：' + build.output.slice(-500) });
      // 3. 部署到 Cloudflare Worker（dun.zenslab.top 绑定 dundun-pupu）
      const deploy = await runCmd(
        `npx wrangler deploy --config dist/server/wrangler.json --name ${CF_WORKER_NAME}`,
        600000,
      );
      if (!deploy.ok) return send(500, { ok: false, error: 'Cloudflare 部署失败：' + deploy.output.slice(-500) });
      return send(200, {
        ok: true,
        message: `已上线 Cloudflare，几秒内生效。${archiveNote}`,
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

function openBrowser(done) {
  const url = `http://127.0.0.1:${PORT}`;
  // 依次尝试显式浏览器路径，避免默认浏览器关联异常时静默失败
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const browser = candidates.find((p) => existsSync(p));
  // --new-window：Chrome/Edge 已在运行时也强制弹出新窗口并置前，
  // 而不是把页面塞进已存在的（可能最小化的）窗口里当标签页
  const cmd = browser ? `"${browser}" --new-window ${url}` : `start "" ${url}`;
  exec(cmd, { windowsHide: true }, (err) => {
    if (err) console.error('打开浏览器失败：', err.message, '（可手动访问 ' + url + '）');
    if (done) done();
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // 已经有一个后台在跑：等浏览器拉起来之后再退出
    // （不能立刻 exit，否则 exec 还没完成就被杀，Chrome 可能弹不出来）
    console.log('后台已在运行，直接打开页面 ' + new Date().toLocaleString('zh-CN'));
    openBrowser(() => process.exit(0));
    setTimeout(() => process.exit(0), 8000); // 兜底：浏览器无响应时也确保退出
  } else {
    throw err;
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('内容后台已启动：http://127.0.0.1:%s （Ctrl+C 关闭；只监听本机，外部无法访问）', PORT);
  openBrowser();
});
