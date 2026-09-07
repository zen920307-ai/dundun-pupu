'use client';
import NextImage, { type ImageProps } from 'next/image';
import { useState } from 'react';

// Asset revision changes the URL after an unfinished-preview 404, so an existing
// browser tab does not retain a broken image at the same address after HMR.
const ASSET_REVISION = 'stickers-ready-3';
export default function IPImage(props: ImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const source = typeof props.src === 'string' ? props.src : '';
  if (source && failedSource === source) {
    return (
      <span className={'image-recovery ' + (props.className ?? '')}>
        <span>{props.alt || '角色图片'}暂时没赶上。</span>
        <button
          onClick={() => {
            setRetry((v) => v + 1);
            setFailedSource(null);
          }}
        >
          喊它回来 ↻
        </button>
      </span>
    );
  }
  const src = source.startsWith('/media/')
    ? `${source}${source.includes('?') ? '&' : '?'}asset=${ASSET_REVISION}-${retry}`
    : props.src;
  return (
    <NextImage
      {...props}
      src={src}
      onError={(event) => {
        if (source) setFailedSource(source);
        props.onError?.(event);
      }}
    />
  );
}
