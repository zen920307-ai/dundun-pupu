'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Image from './IPImage';
import { Volume2, VolumeX, Sparkles, Pause } from 'lucide-react';

export default function SiteHeader({
  active = 'home',
  motion,
  onMotionChange,
}: {
  active?: 'home' | 'kv' | 'wallpapers' | 'travel';
  motion?: boolean;
  onMotionChange?: () => void;
}) {
  const [sound, setSound] = useState(true);
  const soundRef = useRef(true);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    let stored = true;
    try {
      stored = localStorage.getItem('duo-sfx') !== 'off';
    } catch {
      /* Private browsing can disable storage. */
    }
    soundRef.current = stored;
    const frame = requestAnimationFrame(() => setSound(stored));
    let lastHover = 0;
    const play = (kind: 'hover' | 'pop' | 'magic') => {
      const ctx = audio.current;
      if (
        !soundRef.current ||
        !ctx ||
        ctx.state !== 'running' ||
        document.hidden
      )
        return;
      const now = ctx.currentTime;
      const count = kind === 'magic' ? 3 : kind === 'pop' ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        const start = now + i * 0.065,
          duration = kind === 'hover' ? 0.075 : 0.14;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(
          (kind === 'hover' ? 680 : 520) * (1 + i * 0.32),
          start,
        );
        osc.frequency.exponentialRampToValueAtTime(
          (kind === 'hover' ? 940 : 1040) * (1 + i * 0.16),
          start + 0.03,
        );
        osc.frequency.exponentialRampToValueAtTime(
          400 + i * 160,
          start + duration,
        );
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
          kind === 'hover' ? 0.018 : 0.04,
          start + 0.008,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.015);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }
    };
    const unlock = () => {
      if (!soundRef.current) return;
      try {
        audio.current ??= new AudioContext();
        if (audio.current.state === 'suspended')
          void audio.current.resume().catch(() => {});
      } catch {
        /* The visual interactions remain available without audio. */
      }
    };
    const click = (event: MouseEvent) => {
      const target = (event.target as Element).closest('button,a');
      if (!target || target.closest('[data-silent]')) return;
      unlock();
      play(
        target.matches('.random-mood,.mission-button,.chaos-button')
          ? 'magic'
          : 'pop',
      );
    };
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || performance.now() - lastHover < 160)
        return;
      const target = (event.target as Element).closest('button,a');
      if (
        !target ||
        target.closest('[data-silent]') ||
        (event.relatedTarget instanceof Node &&
          target.contains(event.relatedTarget))
      )
        return;
      lastHover = performance.now();
      play('hover');
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('click', click);
    document.addEventListener('pointerover', hover);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('click', click);
      document.removeEventListener('pointerover', hover);
      const ctx = audio.current;
      audio.current = null;
      if (ctx) void ctx.close().catch(() => {});
    };
  }, []);
  const toggleSound = () => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSound(next);
    try {
      localStorage.setItem('duo-sfx', next ? 'on' : 'off');
    } catch {
      /* Optional preference persistence. */
    }
    if (!next && audio.current?.state === 'running')
      void audio.current.suspend();
  };
  return (
    <header className="site-header">
      <Link className="site-logo" href="/" aria-label="墩墩和噗噗首页">
        <Image
          src="/media/logo-flat.png"
          width={64}
          height={64}
          alt=""
          preload
        />
        <span>
          墩墩<span className="logo-and">&</span>噗噗
          <small>两只小可爱 · 原创 IP BY 拯</small>
        </span>
      </Link>
      <nav className="site-nav" aria-label="主导航">
        <Link href="/#duo">两位主角</Link>
        <Link className="nav-travel" href="/travel" aria-current={active === 'travel' ? 'page' : undefined}>
          出逃档案 <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/kv" aria-current={active === 'kv' ? 'page' : undefined}>
          主视觉 KV<span className="nav-dot">21</span>
        </Link>
        <Link
          href="/wallpapers"
          aria-current={active === 'wallpapers' ? 'page' : undefined}
        >
          手机壁纸<span className="nav-dot">24</span>
        </Link>
        <Link href="/#festival">节日放映</Link>
        <Link href="/#moods">胡闹现场</Link>
        <Link href="/#archive">可爱设计</Link>
      </nav>
      <div className="header-switches" data-silent>
        <button
          className="sfx-toggle"
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={sound ? '关闭可爱音效' : '打开可爱音效'}
          title="点击、悬停的小音效（首次点击后生效）"
        >
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>音效 {sound ? '开' : '关'}</span>
        </button>
        {onMotionChange && (
          <button
            className="sfx-toggle motion-switch"
            onClick={onMotionChange}
            aria-pressed={motion}
            aria-label={motion ? '关闭动效' : '打开动效'}
            title={motion ? '动效开启中，点击关闭' : '动效已关闭，点击打开'}
          >
            {motion ? <Sparkles size={17} /> : <Pause size={17} />}
            <span>{motion ? '动效 开' : '动效 关'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
