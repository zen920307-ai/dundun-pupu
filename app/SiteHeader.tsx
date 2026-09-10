'use client';
import { useEffect, useRef, useState } from 'react';
import Image from './IPImage';
import { playSound, type SoundKind } from './sound';
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
    let lastSound = 0;
    const play = (kind: SoundKind) => {
      const ctx = audio.current;
      if (!soundRef.current || !ctx || ctx.state !== 'running' || document.hidden) return;
      if (performance.now() - lastSound < 45) return;
      lastSound = performance.now();
      playSound(ctx, kind);
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
      if (target.hasAttribute('data-cue')) return;
      const kind: SoundKind = target.matches('.chaos-button') ? 'chaos'
        : target.matches('.random-mood') ? 'draw'
        : target.matches('.mission-button') ? 'paper'
        : target.matches('.sticker-widget,.duo-button') ? 'squish'
        : target.matches('.quiz-answer') ? 'answer'
        : target.matches('.archive-card,.portal,.trip-open') ? 'navigate' : 'pop';
      play(kind);
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
    const cue = (event: Event) => play((event as CustomEvent<SoundKind>).detail);
    document.addEventListener('pointerdown', unlock);
    window.addEventListener('duo-sound', cue);
    document.addEventListener('keydown', unlock);
    document.addEventListener('click', click);
    document.addEventListener('pointerover', hover);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('duo-sound', cue);
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
      void audio.current.suspend().catch(() => {});
    if (next) {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume().then(() => { if (soundRef.current && audio.current) playSound(audio.current, 'reveal'); }).catch(() => {});
      } catch { /* Audio is optional. */ }
    }
  };
  return (
    <header className="site-header">
      <a className="site-logo" href="/" aria-label="墩墩和噗噗首页">
        <Image
          src="/media/logo-flat.webp"
          width={64}
          height={64}
          alt=""
          preload
        />
        <span>
          墩墩<span className="logo-and">&</span>噗噗
          <small>两只小可爱 · 原创 IP BY 拯</small>
        </span>
      </a>
      <nav className="site-nav" aria-label="主导航">
        <a href="/#duo">两位主角</a>
        <a className="nav-travel" href="/travel" aria-current={active === 'travel' ? 'page' : undefined}>
          出逃档案 <span aria-hidden="true">↗</span>
        </a>
        <a href="/kv" aria-current={active === 'kv' ? 'page' : undefined}>
          主视觉 KV<span className="nav-dot">21</span>
        </a>
        <a
          href="/wallpapers"
          aria-current={active === 'wallpapers' ? 'page' : undefined}
        >
          手机壁纸<span className="nav-dot">24</span>
        </a>
        <a href="/#festival">节日放映</a>
        <a href="/#moods">胡闹现场</a>
        <a href="/#archive">可爱设计</a>
        <a href="/#origin">创作灵感</a>
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
