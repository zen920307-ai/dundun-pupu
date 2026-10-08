import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = 'root@182.92.151.173';
const sshOptions = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=15', '-i', path.join(homedir(), '.ssh', 'lvji_aliyun_rsa_v2')];

function run(command, args, capture = false) {
  return new Promise((resolve, reject) => {
    let output = '';
    const child = spawn(command, args, { cwd: root, stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit', windowsHide: true, timeout: 1800000 });
    child.stdout?.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve(output) : reject(new Error(`${command} exited with ${code}`)));
  });
}

await access(path.join(root, 'dist/standalone/server.js'));
await mkdir(path.join(root, 'outputs'), { recursive: true });
const release = `release-${Date.now()}`;
const archive = path.join(root, 'outputs', `${release}.tar.gz`);
const standalone = path.join(root, 'dist/standalone');
const manifest = {};
async function scan(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (!prefix && (entry.name === 'public' || entry.name.startsWith('.deployment-'))) continue;
    if (/[\r\n]/.test(relative)) throw new Error('Unsupported deployment filename');
    if (entry.isDirectory()) await scan(path.join(directory, entry.name), relative + '/');
    else if (entry.isFile()) manifest[relative] = createHash('sha256').update(await readFile(path.join(directory, entry.name))).digest('hex');
    else throw new Error(`Unsupported deployment entry: ${relative}`);
  }
}
await scan(standalone);
const previous = JSON.parse(await run('ssh', [...sshOptions, target, "if test -f /srv/dundun-pupu/current/.deployment-manifest.json; then cat /srv/dundun-pupu/current/.deployment-manifest.json; else printf '{}'; fi"], true));
const changed = Object.keys(manifest).filter(file => manifest[file] !== previous[file]);
await writeFile(path.join(standalone, '.deployment-manifest.json'), JSON.stringify(manifest));
const fileList = path.join(root, 'outputs', `${release}.files`);
await writeFile(fileList, [...changed, '.deployment-manifest.json'].map(file => './' + file).join('\n') + '\n');
console.log(`Uploading ${changed.length} changed files of ${Object.keys(manifest).length}`);
await run('tar', ['-czf', archive, '-C', 'dist/standalone', '-T', fileList]);
const hash = createHash('sha256');
for await (const chunk of createReadStream(archive)) hash.update(chunk);
const digest = hash.digest('hex');
await run('ssh', [...sshOptions, target, 'mkdir -p /srv/dundun-pupu/uploads']);
await run('scp', [...sshOptions, archive, `${target}:/srv/dundun-pupu/uploads/${release}.tar.gz`]);
await run('scp', [...sshOptions, 'deploy/activate.sh', `${target}:/srv/dundun-pupu/activate.sh`]);
await run('scp', [...sshOptions, 'deploy/prune-release.mjs', `${target}:/srv/dundun-pupu/prune-release.mjs`]);
await run('ssh', [...sshOptions, target, `sh /srv/dundun-pupu/activate.sh ${release} ${digest}`]);
const response = await fetch(`https://dun.zenslab.top/deploy-release.txt?deploy=${release}`, { signal: AbortSignal.timeout(30000) });
if (!response.ok || (await response.text()).trim() !== release) {
  throw new Error(`服务器已部署，但域名尚未指向本次发布（HTTP ${response.status}）；请检查 DNS。`);
}
console.log(`阿里云发布成功：${release} https://dun.zenslab.top/`);
