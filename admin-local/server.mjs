// ============================================================
// 本地内容后台服务 —— node admin-local/server.mjs（或 npm run admin）
// 只监听 127.0.0.1，仅本机可访问；数据写入 content/*.json，
// 「保存并发布」= git 存档 + 本地构建 + wrangler 部署到 Cloudflare Worker，约 1 分钟后线上生效。
// ============================================================
import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const MEDIA_DIR = path.join(ROOT, 'public', 'cms-media');
const PORT = 4321;
const GIT_BRANCH = 'master';
const noBrowser = process.argv.includes('--no-browser');

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

// 长耗时命令（构建/部署）；剥离 NODE_OPTIONS 与代理变量，
// 避免 require 钩子干扰构建、代理故障时构建内 fetch 挂死（YepFast 曾 502 拖死整个 build）
const CF_WORKER_NAME = 'dundun-pupu'; // dun.zenslab.top 绑定的 Worker
function cleanEnv({ keepProxy = false } = {}) {
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  if (!keepProxy) {
    for (const k of Object.keys(env)) {
      if (/^(https?_proxy|all_proxy|ftp_proxy)$/i.test(k)) delete env[k];
    }
    env.NO_PROXY = '*';
    env.no_proxy = '*';
  }
  return env;
}
function runCmd(cmd, timeoutMs = 300000, opts = {}) {
  const env = cleanEnv(opts);
  // 输出写日志文件 + 哨兵文件标记完成，轮询检测——
  // 规避构建孙进程占用 stdio 管道导致 exec 回调永不触发（Windows 经典坑）
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const logFile = path.join(os.tmpdir(), `admin-cmd-${stamp}.log`);
  const doneFile = logFile + '.done';
  const batFile = path.join(os.tmpdir(), `admin-cmd-${stamp}.cmd`);
  const bat = `@echo off\r\n${cmd} > "${logFile}" 2>&1\r\necho %ERRORLEVEL% > "${doneFile}"\r\n`;
  const t0 = Date.now();
  return (async () => {
    await fs.writeFile(batFile, bat, 'utf8');
    // Node 22 禁止直接 spawn .cmd（CVE 修复），显式经 cmd.exe 启动
    const child = spawn('cmd.exe', ['/d', '/s', '/c', batFile], { cwd: ROOT, windowsHide: true, env, timeout: timeoutMs });
    child.unref?.();
    for (;;) {
      await new Promise((r) => setTimeout(r, 1500));
      let done = false;
      try {
        await fs.access(doneFile);
        done = true;
      } catch {}
      if (!done && Date.now() - t0 < timeoutMs) continue;
      try {
        child.kill();
      } catch {}
      let log = '';
      try {
        log = await fs.readFile(logFile, 'utf8');
      } catch {}
      let code = '';
      try {
        code = (await fs.readFile(doneFile, 'utf8')).trim();
      } catch {}
      await fs.rm(logFile, { force: true }).catch(() => {});
      await fs.rm(doneFile, { force: true }).catch(() => {});
      await fs.rm(batFile, { force: true }).catch(() => {});
      return { ok: done && code === '0', output: log.slice(-4000), killed: !done };
    }
  })();
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

// 清理构建僵尸进程（被强杀的构建会留下 esbuild/workerd，拖死后续构建）
async function killBuildZombies() {
  await runCmd('taskkill /F /IM esbuild.exe /T', 15000).catch(() => {});
  await runCmd('taskkill /F /IM workerd.exe /T', 15000).catch(() => {});
}

// 构建专用：轮询日志判定完成。本机环境下构建完成后 npm 可能不退出（进程树挂住），
// 所以不依赖进程退出，见到「Build complete」即成功并清理进程树
async function runBuild(timeoutMs = 150000) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const logFile = path.join(os.tmpdir(), `admin-build-${stamp}.log`);
  const doneFile = logFile + '.done';
  const batFile = path.join(os.tmpdir(), `admin-build-${stamp}.cmd`);
  await fs.writeFile(batFile, `@echo off\r\nnpm run build > "${logFile}" 2>&1\r\necho %ERRORLEVEL% > "${doneFile}"\r\n`, 'utf8');
  const t0 = Date.now();
  const child = spawn('cmd.exe', ['/d', '/s', '/c', batFile], { cwd: ROOT, windowsHide: true, env: cleanEnv() });
  child.unref?.();
  const killTree = () => runCmd(`taskkill /F /PID ${child.pid} /T`, 15000).catch(() => {});
  try {
    for (;;) {
      await new Promise((r) => setTimeout(r, 1500));
      let log = '';
      try {
        log = await fs.readFile(logFile, 'utf8');
      } catch {}
      let done = false;
      let code = '';
      try {
        code = (await fs.readFile(doneFile, 'utf8')).trim();
        done = true;
      } catch {}
      if (log.includes('Build complete')) {
        await killTree();
        return { ok: true, output: log.slice(-4000) };
      }
      if (done) {
        await killTree();
        return { ok: code === '0', output: log.slice(-4000) };
      }
      if (Date.now() - t0 > timeoutMs) {
        await killTree();
        return { ok: false, output: log.slice(-4000) + '\n（构建超时被终止）' };
      }
    }
  } finally {
    await fs.rm(logFile, { force: true }).catch(() => {});
    await fs.rm(doneFile, { force: true }).catch(() => {});
    await fs.rm(batFile, { force: true }).catch(() => {});
  }
}

// 部署专用：与 runBuild 同款轮询判定。wrangler 打印「Current Version ID:」即部署完成，
// 不等待进程退出（本机环境下 wrangler 也可能挂住不退出）
async function runDeploy(timeoutMs = 300000, opts = {}) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const logFile = path.join(os.tmpdir(), `admin-deploy-${stamp}.log`);
  const doneFile = logFile + '.done';
  const batFile = path.join(os.tmpdir(), `admin-deploy-${stamp}.cmd`);
  const cmd = `npx wrangler deploy --config dist/server/wrangler.json --name ${CF_WORKER_NAME}`;
  await fs.writeFile(batFile, `@echo off\r\n${cmd} > "${logFile}" 2>&1\r\necho %ERRORLEVEL% > "${doneFile}"\r\n`, 'utf8');
  const t0 = Date.now();
  const child = spawn('cmd.exe', ['/d', '/s', '/c', batFile], { cwd: ROOT, windowsHide: true, env: cleanEnv(opts) });
  child.unref?.();
  const killTree = () => runCmd(`taskkill /F /PID ${child.pid} /T`, 15000).catch(() => {});
  try {
    for (;;) {
      await new Promise((r) => setTimeout(r, 1500));
      let log = '';
      try {
        log = await fs.readFile(logFile, 'utf8');
      } catch {}
      let done = false;
      let code = '';
      try {
        code = (await fs.readFile(doneFile, 'utf8')).trim();
        done = true;
      } catch {}
      if (log.includes('Current Version ID:')) {
        await killTree();
        return { ok: true, output: log.slice(-4000) };
      }
      if (done) {
        await killTree();
        return { ok: code === '0' && log.includes('Current Version ID:'), output: log.slice(-4000) };
      }
      if (Date.now() - t0 > timeoutMs) {
        await killTree();
        return { ok: false, output: log.slice(-4000) + '\n（部署超时被终止）' };
      }
    }
  } finally {
    await fs.rm(logFile, { force: true }).catch(() => {});
    await fs.rm(doneFile, { force: true }).catch(() => {});
    await fs.rm(batFile, { force: true }).catch(() => {});
  }
}

// ---------- 发布任务状态（前端轮询 /api/publish/status 画进度条） ----------
const pubState = { running: false, stage: '', note: '', startedAt: 0, ok: null, error: '', message: '' };

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

    // 发布进度查询
    if (url.pathname === '/api/publish/status') {
      return send(200, { ok: true, ...pubState });
    }

    // 发布：git 存档 + 本地构建 + wrangler 部署到 Cloudflare Worker（全程约 1 分钟）
    if (url.pathname === '/api/publish' && req.method === 'POST') {
      const { message } = await body().catch(() => ({ message: '' }));
      if (pubState.running) return send(409, { ok: false, error: '已有发布任务在进行中，请等它完成' });
      pubState.running = true;
      pubState.ok = null;
      pubState.error = '';
      pubState.message = '';
      pubState.startedAt = Date.now();
      const fail = (code, msg) => {
        pubState.running = false;
        pubState.error = msg;
        return send(code, { ok: false, error: msg });
      };
      // 1. git 存档（有改动才提交；推送失败不阻塞上线）
      pubState.stage = 'archive';
      pubState.note = '正在存档内容改动到 git…';
      await gitExec('git add -A');
      const status = await gitExec('git status --porcelain');
      let archiveNote = '无内容改动，跳过 git 存档';
      if (status.output.trim()) {
        const commitMsg = (message || `内容更新 ${new Date().toLocaleString('zh-CN')}`).replace(/"/g, "'");
        const commit = await gitExec(`git commit -m "${commitMsg}"`);
        if (!commit.ok) return fail(500, 'git commit 失败：' + commit.output);
        const push = await gitExec(`git push origin ${GIT_BRANCH}`);
        archiveNote = push.ok ? '已推送 GitHub 存档' : 'GitHub 推送失败（不影响上线）：' + push.output.slice(-120);
      }
      // 2. 构建（vinext build）——不带代理避免故障代理拖死；失败清僵尸重试一次
      pubState.stage = 'build';
      pubState.note = '正在构建网站（vinext build）…';
      let build = await runBuild(150000);
      if (!build.ok) {
        pubState.note = '构建异常，清理残留进程后重试…';
        await killBuildZombies();
        await new Promise((r) => setTimeout(r, 2000));
        build = await runBuild(150000);
      }
      if (!build.ok) return fail(500, '构建失败：' + build.output.slice(-600));
      await killBuildZombies();
      // 3. 部署到 Cloudflare Worker（dun.zenslab.top 绑定 dundun-pupu）；直连失败自动带代理重试
      pubState.stage = 'deploy';
      pubState.note = '正在部署到 Cloudflare（上传资产）…';
      let deploy = await runDeploy(300000);
      if (!deploy.ok) {
        pubState.note = '直连部署失败，改走代理重试…';
        deploy = await runDeploy(300000, { keepProxy: true });
      }
      if (!deploy.ok) return fail(500, 'Cloudflare 部署失败：' + deploy.output.slice(-600));
      pubState.running = false;
      pubState.ok = true;
      pubState.stage = 'done';
      pubState.message = `已上线 Cloudflare，几秒内生效。${archiveNote}`;
      return send(200, { ok: true, message: pubState.message });
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
  '.ico': 'image/x-icon',
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
  // /admin-local/xxx 直接映射到本目录（favicon 等静态资源）
  const rel = file.startsWith('admin-local/') ? file.slice('admin-local/'.length) : file;
  const full = path.resolve(__dirname, rel);
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
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const browser = candidates.find((p) => existsSync(p));
  // start "" 让 cmd 立即退出；--new-tab 已有窗口时新开标签。windowsHide 会让 Chrome 丢前台。
  const cmd = browser ? `start "" "${browser}" --new-tab ${url}` : `start "" ${url}`;
  exec(cmd, { windowsHide: false }, (err) => {
    if (err) console.error('打开浏览器失败：', err.message, '（可手动访问 ' + url + '）');
    if (done) done();
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (noBrowser) process.exit(0);
    console.log('后台已在运行，直接打开页面 ' + new Date().toLocaleString('zh-CN'));
    openBrowser(() => process.exit(0));
    setTimeout(() => process.exit(0), 8000);
  } else {
    throw err;
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('内容后台已启动：http://127.0.0.1:%s （Ctrl+C 关闭；只监听本机，外部无法访问）', PORT);
  if (!noBrowser) openBrowser();
});
