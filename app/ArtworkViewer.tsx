'use client';
import { ArrowLeft, ArrowRight, Download, X } from 'lucide-react';
import Image from './IPImage';
import { downloadAsPng } from './download';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import type { Artwork } from './gallery-data';

export default function ArtworkViewer({
  items,
  active,
  onChange,
  wallpaper = false,
}: {
  items: Artwork[];
  active: number | null;
  onChange: (next: number | null) => void;
  wallpaper?: boolean;
}) {
  const item = active === null ? null : items[active];
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onChange(null);
      }}
    >
      <DialogContent
        className={
          'art-dialog collection-dialog ' +
          (wallpaper ? 'wallpaper-dialog' : '')
        }
        showCloseButton={false}
      >
        <div className="art-dialog-top">
          <DialogTitle>{item?.title ?? '看一眼可爱'}</DialogTitle>
          <DialogClose className="dialog-close" aria-label="关闭大图">
            <X size={22} />
          </DialogClose>
        </div>
        <DialogDescription className="art-description">
          墩墩和噗噗 · 设计师拯 {item && `· ${item.width} × ${item.height}`}
        </DialogDescription>
        {item && (
          <div className="art-stage">
            <Image
              className="art-full"
              src={item.src}
              width={item.width}
              height={item.height}
              alt={item.title}
            />
            <button
              className="art-download art-download-overlay"
              onClick={() =>
                void downloadAsPng(
                  item.src,
                  `${item.title}-${item.width}x${item.height}`,
                ).catch(() => {})
              }
              aria-label={`下载 PNG：${item.title}`}
            >
              <Download size={17} />
              {wallpaper ? '保存壁纸 PNG' : '下载作品 PNG'}
            </button>
          </div>
        )}
        <div className="art-dialog-controls">
          <button
            aria-label="上一张作品"
            onClick={() =>
              onChange(((active ?? 0) - 1 + items.length) % items.length)
            }
          >
            <ArrowLeft size={18} />
            <span>上一张</span>
          </button>
          <span>
            {(active ?? 0) + 1} / {items.length}
          </span>
          <button
            aria-label="下一张作品"
            onClick={() => onChange(((active ?? 0) + 1) % items.length)}
          >
            <span>下一张</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
