'use client';

// 原始 PNG 只在用户明确下载时请求；网页预览始终使用 WebP。
// - 桌面端：直接下载原始 PNG
// - 移动端（触屏 + 移动 UA）：走系统分享面板，可直接「存储到相册」
export async function downloadOriginal(src: string | undefined, name: string) {
  if (!src) return;
  const response = await fetch(src);
  if (!response.ok) throw new Error(`图片获取失败：${response.status}`);
  const blob = await response.blob();
  const filename = `${name}.png`;
  const file = new File([blob], filename, { type: 'image/png' });
  const isMobile =
    matchMedia('(pointer: coarse)').matches &&
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
