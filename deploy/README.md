# 阿里云部署

网站：https://dun.zenslab.top 。ECS：182.92.151.173（Ubuntu 24.04）。

本地运行 `npm run build` 后，执行 `npm run deploy:aliyun`。本地内容后台的「保存并发布」自动完成这两步，并沿用 Git 存档。

发布使用本机既有 SSH 密钥，所有文件在 `/srv/dundun-pupu/releases/`。构建后的独立 Node 运行包无需在服务器下载 npm 依赖，静态资源由 Nginx 提供，SSR 服务只监听 `127.0.0.1:8092`。本站独立 Node 24 位于 `/opt/dundun-pupu/node`，不会覆盖服务器的其他 Node 服务。本地后台继续只监听本机。

每次发布比较文件 SHA256，仅上传变动文件。新版本通过硬链接复用未变化文件，解包先解除硬链接，保留上一版文件。新版本删除的文件会从新版本中移除。健康检查失败自动恢复上一版。发布后读取线上版本标记确认域名已生效。发布期间会短暂重启 SSR 进程。

检查：`systemctl status dundun-pupu`、`journalctl -u dundun-pupu`、`nginx -t`。

回滚：将 `/srv/dundun-pupu/current` 指回上一版目录，然后执行 `systemctl restart dundun-pupu`。历史版本不自动删除，需定期检查磁盘容量。

DNS：Cloudflare 管理 `dun` 的 A 记录，设为 DNS only，指向 ECS。旧 Cloudflare Worker 保留为迁移备份，其自定义域名绑定在切换时移除。HTTPS 证书由 Certbot 提供，续期使用本站的 HTTP 验证目录 `/srv/dundun-pupu/acme`。

验证：`node scripts/verify-deployment.mjs https://dun.zenslab.top`。
