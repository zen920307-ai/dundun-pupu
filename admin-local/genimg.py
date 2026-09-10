# 一张图自动生成全套格式：主图 webp + 缩略图 webp，并回报尺寸
# 用法: python genimg.py <源文件> <输出目录> <基础文件名> <主图最大宽> <缩略图最大宽>
import json
import os
import sys

from PIL import Image


def main():
    src, out_dir, base = sys.argv[1], sys.argv[2], sys.argv[3]
    main_max, thumb_max = int(sys.argv[4]), int(sys.argv[5])
    img = Image.open(src)
    # 保留透明通道，其余统一转 RGB
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA' if 'transparency' in img.info or img.mode in ('P', 'LA') else 'RGB')

    w, h = img.size
    if w > main_max:
        img_main = img.resize((main_max, max(1, round(h * main_max / w))), Image.LANCZOS)
    else:
        img_main = img.copy()
    main_path = os.path.join(out_dir, base + '.webp')
    img_main.save(main_path, 'WEBP', quality=85)

    if w > thumb_max:
        img_thumb = img.resize((thumb_max, max(1, round(h * thumb_max / w))), Image.LANCZOS)
    else:
        img_thumb = img.copy()
    thumb_path = os.path.join(out_dir, base + '-thumb.webp')
    img_thumb.save(thumb_path, 'WEBP', quality=82)

    print(json.dumps({
        'main': os.path.basename(main_path),
        'thumb': os.path.basename(thumb_path),
        'width': img_main.size[0],
        'height': img_main.size[1],
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
