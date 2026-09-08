'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowUpRight, Expand, Download } from 'lucide-react';
import SiteHeader from './SiteHeader';
import Image from './IPImage';
import ArtworkViewer from './ArtworkViewer';
import { kv, wallpapers } from './gallery-data';

export default function Collection({ kind }: { kind: 'kv' | 'wallpapers' }) {
  const wallpaper = kind === 'wallpapers';
  const items = wallpaper ? wallpapers : kv;
  const [filter, setFilter] = useState('全部'),
    [active, setActive] = useState<number | null>(null),
    [motion, setMotion] = useState(true);
  const shown = items.filter(
    (item) => filter === '全部' || item.tag === filter,
  );
  const categories = ['全部', ...new Set(items.map((item) => item.tag))];
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const frame = requestAnimationFrame(() => setMotion(!media.matches));
    const changed = () => setMotion(!media.matches);
    media.addEventListener('change', changed);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener('change', changed);
    };
  }, []);
  useEffect(() => {
    if (!motion || !grid.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.collection-card',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.025,
          ease: 'back.out(1.15)',
        },
      );
    }, grid);
    return () => ctx.revert();
  }, [filter, motion]);
  return (
    <main
      className={
        'collection-page ' + (wallpaper ? 'wallpapers-page' : 'kv-page')
      }
      data-motion={motion}
    >
      <SiteHeader
        active={kind}
        motion={motion}
        onMotionChange={() => setMotion(!motion)}
      />
      <section className="collection-intro section">
        <a className="crumb-back" href="/">
          <ArrowLeft size={16} /> 返回胡闹现场
        </a>
        <div className="collection-heading">
          <div>
            <p className="collection-overline">
              {wallpaper
                ? 'POCKET-SIZED FRIENDSHIP / 随身携带的好朋友'
                : 'DUNDUN & PUPU / 脑洞巨幕放映中'}
            </p>
            <h1>
              {wallpaper ? (
                <>
                  把好朋友，
                  <br />
                  <span>装进锁屏里。</span>
                </>
              ) : (
                <>
                  小小两只。
                  <br />
                  <span>好大的脑洞。</span>
                </>
              )}
            </h1>
            <p>
              {wallpaper
                ? '24 张手机壁纸。从宇宙沙发到被窝角落，每次亮屏，都让他俩陪着你。'
                : '21 张原创主视觉。在咖啡店、游戏厅、月光下……他们的日常，总有一点出乎意料。'}
            </p>
          </div>
          <div className="collection-decoration">
            <span className="collection-seal">
              {wallpaper ? '贴身陪伴\n允许带走' : '全员可爱\n禁止正经'}
            </span>
            <Image
              src={wallpaper ? '/media/keychain-sticker.png' : '/media/duo.png'}
              width={330}
              height={350}
              alt=""
              className="collection-mascot"
            />
          </div>
        </div>
        <div className="collection-toolbar">
          <div className="filter-tabs" aria-label="按主题筛选">
            {categories.map((tag) => (
              <button
                key={tag}
                aria-pressed={filter === tag}
                className={filter === tag ? 'active' : ''}
                onClick={() => {
                  setFilter(tag);
                  setActive(null);
                }}
              >
                {tag}
                <sup>
                  {tag === '全部'
                    ? items.length
                    : items.filter((i) => i.tag === tag).length}
                </sup>
              </button>
            ))}
          </div>
          <span className="gallery-counter" aria-live="polite">
            可爱库存 {String(shown.length).padStart(2, '0')} 件
          </span>
        </div>
        <div
          className={
            'collection-grid ' + (wallpaper ? 'wallpaper-grid' : 'kv-grid')
          }
          ref={grid}
        >
          {shown.map((item, i) => (
            <article key={item.id} className="collection-card">
              <button
                className="collection-image"
                onClick={() => setActive(i)}
                aria-label={`查看${wallpaper ? '壁纸' : '主视觉'}：${item.title}`}
              >
                <Image
                  src={item.thumb}
                  width={item.width}
                  height={item.height}
                  alt={item.title}
                  loading={i < 3 ? 'eager' : 'lazy'}
                />
                <span className="image-expand">
                  <Expand size={18} />
                </span>
              </button>
              <div className="collection-caption">
                <span>
                  {String(items.indexOf(item) + 1).padStart(2, '0')} /{' '}
                  {item.tag}
                </span>
                <h2>{item.title}</h2>
                {wallpaper ? (
                  <a
                    href={item.src}
                    download={`${item.title}.webp`}
                    className="wallpaper-save"
                    aria-label={`保存壁纸：${item.title}`}
                  >
                    <Download size={16} />
                    带它走
                  </a>
                ) : (
                  <button
                    className="kv-open"
                    onClick={() => setActive(i)}
                    aria-label={`打开主视觉：${item.title}`}
                  >
                    <ArrowUpRight size={20} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="collection-end">
          <p>看到这里，你的可爱浓度已经超标。</p>
          <a
            className="pill orange"
            href={wallpaper ? '/kv' : '/wallpapers'}
          >
            {wallpaper ? '去看更大的脑洞' : '顺便换张壁纸'}
            <ArrowUpRight size={18} />
          </a>
          <a href="/" className="collection-home">
            回家继续胡闹 ↗
          </a>
        </div>
      </section>
      <ArtworkViewer
        items={shown}
        active={active}
        onChange={setActive}
        wallpaper={wallpaper}
      />
    </main>
  );
}
