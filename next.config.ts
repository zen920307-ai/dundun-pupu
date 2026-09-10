import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // 站点部署在 Cloudflare Worker（SSR + 静态资产），由本地后台「保存并发布」触发
  // vinext build → wrangler deploy --config dist/server/wrangler.json
};

export default nextConfig;
