'use client';

// 把站点里的 WebP 图统一转成 PNG 交给用户：
// - 桌面端：直接触发浏览器下载 .png
// - 移动端（触屏 + 移动 UA）：走系统分享面板，可直接「存储到相册」
export async function downloadAsPng(src: string, name: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`图片获取失败：${response.status}`);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('画布不可用');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const png = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!png) throw new Error('PNG 转换失败');
  const filename = `${name}.png`;
  const file = new File([png], filename, { type: 'image/png' });
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
