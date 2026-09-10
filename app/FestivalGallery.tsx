'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand } from 'lucide-react';
import gsap from 'gsap';
import Image from './IPImage';
import { festivals } from './gallery-data';
import ArtworkViewer from './ArtworkViewer';

export default function FestivalGallery({ motion }: { motion: boolean }) {
  const [filter, setFilter] = useState('全部'),
    [selected, setSelected] = useState(0),
    [viewer, setViewer] = useState<number | null>(null);
  const shown = festivals.filter((i) => filter === '全部' || i.tag === filter);
  const current = shown[selected] ?? shown[0];
  const screen = useRef<HTMLButtonElement>(null);
  const reel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!motion || !screen.current) return;
    const animation = gsap.fromTo(
      screen.current,
      { opacity: 0.35, scale: 0.985, rotation: -0.6 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'power2.out' },
    );
    return () => {
      animation.kill();
    };
  }, [selected, filter, motion]);
  useEffect(() => {
    const strip = reel.current,
      target = strip?.children[selected] as HTMLElement | undefined;
    if (strip && target)
      strip.scrollTo({
        left:
          target.offsetLeft -
          strip.offsetLeft -
          strip.clientWidth / 2 +
          target.clientWidth / 2,
        behavior: motion ? 'smooth' : 'instant',
      });
  }, [selected, filter, motion]);
  const move = (direction: number) =>
    setSelected((i) => (i + direction + shown.length) % shown.length);
  return (
    <section className="festival section" id="festival">
      <div className="section-kicker">
        <span>03 / THE LITTLE FESTIVAL CINEMA</span>
        <span>日历随便翻，搭子不换。</span>
      </div>
      <div className="festival-heading">
        <h2>
          每个节日，
          <br />
          <span>都有我们俩。</span>
        </h2>
        <p>
          把春风、月光、热乎乎的团圆，
          <br />
          放进同一本友情日历。
          <br />
          <span>14 张节日与时令海报 · 开始放映 ↓</span>
        </p>
        <Image
          className="festival-mascot"
          src="/media/duo.webp"
          width={260}
          height={260}
          alt=""
        />
      </div>
      <div className="filter-tabs festival-tabs" aria-label="节日主题">
        {['全部', '春日', '团圆', '新春', '暖冬', '秋游'].map((tag) => (
          <button
            key={tag}
            className={filter === tag ? 'active' : ''}
            aria-pressed={filter === tag}
            onClick={() => {
              setFilter(tag);
              setSelected(0);
            }}
          >
            {tag}
            <sup>
              {tag === '全部'
                ? festivals.length
                : festivals.filter((i) => i.tag === tag).length}
            </sup>
          </button>
        ))}
      </div>
      <div className="festival-projection">
        <button
          className="festival-screen"
          ref={screen}
          onClick={() => setViewer(selected)}
          aria-label={`放大海报：${current.title}`}
        >
          <Image
            src={current.src}
            width={current.width}
            height={current.height}
            alt={current.title}
          />
          <span className="festival-enlarge">
            <Expand size={17} />
            放大看看
          </span>
        </button>
        <div className="festival-caption" aria-live="polite">
          <span className="on-air">● 正在放映 / {current.tag}</span>
          <h3>{current.title}</h3>
          <p>
            好日子要一起过。
            <br />
            普通日子，也算。
          </p>
          <div className="festival-controls">
            <button onClick={() => move(-1)} aria-label="上一张节日海报">
              <ArrowLeft size={22} />
            </button>
            <span>
              {String(selected + 1).padStart(2, '0')}{' '}
              <i>/ {String(shown.length).padStart(2, '0')}</i>
            </span>
            <button onClick={() => move(1)} aria-label="下一张节日海报">
              <ArrowRight size={22} />
            </button>
          </div>
          <span className="cinema-note">
            墩墩：不用买票。
            <br />
            噗噗：带上好朋友就行！
          </span>
        </div>
      </div>
      <div className="festival-reel" ref={reel} aria-label="全部海报缩略图">
        {shown.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={selected === i}
            className={selected === i ? 'selected' : ''}
            onClick={() => setSelected(i)}
            aria-label={`选择海报：${item.title}`}
          >
            <Image
              src={item.thumb}
              width={180}
              height={102}
              alt=""
              loading="lazy"
            />
            <span>
              {String(i + 1).padStart(2, '0')} · {item.title}
            </span>
          </button>
        ))}
      </div>
      <p className="reel-hint">← 横向翻一翻，还有更多好日子 →</p>
      <ArtworkViewer items={shown} active={viewer} onChange={setViewer} />
    </section>
  );
}
