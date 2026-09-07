'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Image from './IPImage';
import Universe from './Universe';
import { INTRO_VIDEO } from './content';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowUpRight,
  ArrowDown,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Plus,
} from 'lucide-react';

const memories = [
  {
    image: 'rain',
    title: '雨很大。伞往你那边。',
    note: '嘴上嫌弃，身体很诚实。',
    no: '01 / 偏心现场',
  },
  {
    image: 'cooking',
    title: '正事没有，饭不能少。',
    note: '一个负责捣乱，一个负责一起捣乱。',
    no: '02 / 厨房事故',
  },
  {
    image: 'moon',
    title: '今天也一起，浪费月亮。',
    note: '没什么大事。和你发呆算一件。',
    no: '03 / 友情充电',
  },
  {
    image: 'spring',
    title: '出门？带上你就行。',
    note: '目的地随便，搭子必须是你。',
    no: '04 / 随机出走',
  },
];
export default function Home() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reaction = useRef<HTMLDivElement>(null);
  const manualPause = useRef(false);
  const heroVisible = useRef(true);
  const [needsStart, setNeedsStart] = useState(false);
  const [muted, setMuted] = useState(false),
    [playing, setPlaying] = useState(false),
    [motion, setMotion] = useState(true),
    [line, setLine] = useState('别戳。再戳……也行。');
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const initial = requestAnimationFrame(() => setMotion(!media.matches));
    const listener = () => setMotion(!media.matches);
    media.addEventListener('change', listener);
    return () => {
      cancelAnimationFrame(initial);
      media.removeEventListener('change', listener);
    };
  }, []);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const attempt = () => {
      if (
        !heroVisible.current ||
        document.hidden ||
        manualPause.current ||
        matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return;
      void el
        .play()
        .then(() => setNeedsStart(false))
        .catch(() => setNeedsStart(true));
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        heroVisible.current =
          entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (heroVisible.current) attempt();
        else el.pause();
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(el);
    const visibility = () => {
      if (document.hidden) el.pause();
      else attempt();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      el.pause();
    };
  }, []);
  useEffect(() => {
    if (!motion) return;
    const ctx = gsap.context(() => {
      gsap.from('.intro-in', {
        y: 65,
        opacity: 0,
        rotation: 3,
        duration: 0.9,
        stagger: 0.13,
        ease: 'power3.out',
      });
      gsap.to('.hero-copy', {
        yPercent: 28,
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) =>
        gsap.from(el, {
          y: 75,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }),
      );
      gsap.utils.toArray<HTMLElement>('.memory-photo').forEach((el) =>
        gsap.fromTo(
          el,
          { scale: 1.12 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          },
        ),
      );
      gsap.from('.duo-art', {
        y: 120,
        rotation: -9,
        scale: 0.8,
        duration: 1.1,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: '.duo',
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      });
      gsap.to('.ticker-track', {
        xPercent: -50,
        duration: 22,
        repeat: -1,
        ease: 'none',
      });
      gsap.to('.floating-stamp', {
        rotation: 13,
        y: -12,
        duration: 2.3,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
      gsap.utils.toArray<HTMLElement>('.archive-cutout').forEach((el, i) =>
        gsap.from(el, {
          y: 90,
          rotation: i % 2 ? 15 : -15,
          scale: 0.8,
          duration: 0.9,
          ease: 'back.out(1.6)',
          scrollTrigger: {
            trigger: el,
            start: 'top 94%',
            toggleActions: 'play none none reverse',
          },
        }),
      );
      const responsive = gsap.matchMedia();
      responsive.add('(min-width: 851px)', () => {
        gsap.to('.trip-track', {
          x: () =>
            -Math.max(
              0,
              (document.querySelector('.trip-track')?.scrollWidth ?? 0) -
                window.innerWidth,
            ),
          ease: 'none',
          scrollTrigger: {
            trigger: '.trip-track',
            start: 'top 12%',
            end: () => '+=' + window.innerWidth * 1.6,
            pin: window.innerWidth > 850,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => responsive.revert();
    }, root);
    return () => ctx.revert();
  }, [motion]);
  const poke = () => {
    const lines = [
      '墩墩：你最好有事。',
      '噗噗：有事！想和你玩！',
      '墩墩：……就五分钟。',
      '友情续费成功。永久有效。',
      '噗噗：我刚才数了三朵云。',
      '墩墩：这也值得汇报？',
      '噗噗：值得！第四朵更像你！',
      '墩墩：今天不营业。噗噗：那我来营业。',
      '系统提示：搭子黏合度已超标。',
      '警告：两只小可爱正在靠近。',
      '墩墩：别碰帽子。噗噗：就碰一下！',
      '噗噗：你看起来像一颗不开心的丸子。',
      '墩墩：……陪你五分钟。噗噗：一百分钟！',
      '今日成就：一起把时间浪费得很漂亮。',
    ];
    setLine(lines[Math.floor(Math.random() * lines.length)]);
    if (motion && reaction.current)
      gsap.fromTo(
        reaction.current,
        { rotation: -5, scale: 0.94 },
        {
          rotation: 0,
          scale: 1,
          duration: 0.65,
          ease: 'elastic.out(1,.35)',
          overwrite: true,
        },
      );
  };
  return (
    <main ref={root}>
      <a className="skip" href="#duo">
        跳到角色介绍
      </a>
      <header className="navigation">
        <a className="wordmark" href="#home">
          墩墩<span>&</span>噗噗<i>ORIGINAL IP BY 拯</i>
        </a>
        <nav aria-label="主导航">
          <a href="#duo">两位主角</a>
          <a href="#moods">情绪现场</a>
          <a href="#archive">可爱入侵</a>
          <a href="#creator">
            幕后那位 <ArrowUpRight size={16} />
          </a>
        </nav>
        <button
          className="motion-toggle"
          onClick={() => setMotion(!motion)}
          aria-pressed={motion}
        >
          动效 {motion ? 'ON' : 'OFF'}
        </button>
      </header>
      <section className="hero" id="home">
        <video
          ref={video}
          className="hero-video"
          src={INTRO_VIDEO.src}
          poster={INTRO_VIDEO.poster}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={INTRO_VIDEO.label}
        >
          <track
            kind="captions"
            src={INTRO_VIDEO.captions}
            srcLang="zh"
            label="中文画面字幕"
          />
        </video>
        <div className="hero-shade" />
        <div className="hero-top intro-in">
          <span>两只小可爱 · 一个小宇宙</span>
          <span>EST. FRIENDS FOREVER ↗</span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow intro-in">DUNDUN & PUPU</p>
          <h1 className="intro-in">
            不太正经。
            <br />
            <span>但超要好。</span>
          </h1>
          <p className="hero-desc intro-in">
            一个不想营业，一个非要贴贴。
            <br />
            欢迎误入墩墩和噗噗的胡闹现场。
          </p>
          <a className="pill orange intro-in" href="#duo">
            认识这两个家伙 <ArrowDown size={18} />
          </a>
        </div>
        <div className="video-controls">
          {needsStart && (
            <button
              className="sound-start"
              onClick={() => {
                manualPause.current = false;
                if (video.current) {
                  video.current.muted = false;
                  setMuted(false);
                  void video.current
                    .play()
                    .then(() => setNeedsStart(false))
                    .catch(() => setNeedsStart(true));
                }
              }}
            >
              <Volume2 size={19} /> 点一下，有声开场
            </button>
          )}
          <button
            onClick={() => {
              if (video.current) {
                if (video.current.paused) {
                  manualPause.current = false;
                  void video.current
                    .play()
                    .then(() => setNeedsStart(false))
                    .catch(() => setNeedsStart(true));
                } else {
                  manualPause.current = true;
                  video.current.pause();
                }
              }
            }}
            aria-label={playing ? '暂停视频' : '播放视频'}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => setMuted(!muted)}
            aria-label={muted ? '打开视频声音' : '关闭视频声音'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{muted ? '声音，开一下？' : '声音已开启'}</span>
          </button>
          <button
            onClick={() => {
              if (video.current) {
                manualPause.current = false;
                video.current.currentTime = 0;
                void video.current
                  .play()
                  .then(() => setNeedsStart(false))
                  .catch(() => setNeedsStart(true));
              }
            }}
            aria-label="从头播放"
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <div className="hero-bottom">
          <span>SCROLL TO GET WEIRD</span>
          <span>↓ 继续下滑，小心被可爱到</span>
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <span key={i}>
              没头脑 & 不高兴？ &nbsp; ✳ &nbsp; 是最好最好的朋友！ &nbsp; ✳
              &nbsp; DUNDUN & PUPU &nbsp; ✳ &nbsp;{' '}
            </span>
          ))}
        </div>
      </div>
      <section className="duo section" id="duo">
        <div className="section-kicker reveal">
          <span>01 / THE WEIRD LITTLE DUO</span>
          <span>两位，出来营业了。</span>
        </div>
        <h2 className="reveal">
          脾气不一样。
          <br /> <span className="outlined">黏在一起倒是一样。</span>
        </h2>
        <div className="duo-stage">
          <article className="bio dundun reveal">
            <span className="bio-number">01</span>
            <h3>
              墩墩<span>DUNDUN</span>
            </h3>
            <p className="label">看起来不好惹，其实很好抱。</p>
            <p>
              橙帽子，半睁眼。
              <br />
              对世界有一点无语，
              <br />
              对噗噗有无限耐心。
            </p>
            <span className="handnote">「我才没有在等你。」</span>
          </article>
          <div className="duo-center">
            <div className="floating-stamp">
              最佳损友
              <br />
              终身绑定
            </div>
            <button
              className="duo-button"
              onClick={poke}
              aria-label="戳戳墩墩和噗噗"
            >
              <div ref={reaction}>
                <Image
                  unoptimized
                  className="duo-art"
                  src="/media/duo.png"
                  alt="墩墩戴橙色毛线帽，和奶白色的噗噗靠在一起"
                  width="1024"
                  height="1024"
                />
              </div>
            </button>
            <p className="reaction" aria-live="polite">
              {line}
            </p>
            <span className="tiny">↑ 戳戳他俩</span>
          </div>
          <article className="bio pupu reveal">
            <span className="bio-number">02</span>
            <h3>
              噗噗<span>PUPU</span>
            </h3>
            <p className="label">小小一只，快乐超标。</p>
            <p>
              白乎乎，软绵绵。
              <br />
              世界那么大，
              <br />
              最喜欢墩墩旁边。
            </p>
            <span className="handnote">「好巧！我也在等你！」</span>
          </article>
        </div>
      </section>
      <section className="manifesto section">
        <span className="section-kicker reveal">
          FRIENDSHIP, BUT MAKE IT WEIRD.
        </span>
        <h2 className="reveal">
          全世界都催你长大，
          <br />
          我们陪你<span>傻一下。</span>
        </h2>
        <p className="reveal">
          不必时刻开心，也不用假装厉害。
          <br />
          臭着脸也没关系，总有一个家伙，非要坐在你旁边。
        </p>
        <Image
          unoptimized
          className="manifesto-peeker"
          src="/media/pupu-sticker.png"
          width={800}
          height={1000}
          alt=""
          loading="lazy"
        />
        <span className="manifesto-doodle" aria-hidden="true">
          ✳
        </span>
      </section>
      <Universe motion={motion} />
      <section className="moments section" id="moments">
        <Image
          unoptimized
          className="moments-sticker"
          src="/media/keychain-sticker.png"
          width={300}
          height={320}
          alt=""
          aria-hidden="true"
        />
        <div className="section-kicker reveal">
          <span>06 / LITTLE THINGS, BIG MOODS</span>
          <span>友情，没有正经剧本。</span>
        </div>
        <div className="moments-title reveal">
          <h2>
            没什么大事。
            <br />
            <span>都是我们的事。</span>
          </h2>
          <p>
            一些胡闹，一点偏心。
            <br />
            还有好多好多一起。
          </p>
        </div>
        <div className="memory-grid">
          {memories.map((m, i) => (
            <article className={'memory memory-' + i + ' reveal'} key={m.image}>
              <div className="photo-wrap">
                <Image
                  unoptimized
                  className="memory-photo"
                  src={'/media/' + m.image + '.webp'}
                  alt={m.title}
                  width="1400"
                  height="788"
                  loading="lazy"
                />
              </div>
              <div className="memory-caption">
                <span>{m.no}</span>
                <Plus aria-hidden="true" size={20} />
              </div>
              <h3>{m.title}</h3>
              <p>{m.note}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="creator" id="creator">
        <Image
          unoptimized
          src="/media/designer.webp"
          alt="设计师拯的三维卡通形象，在工作室里创作"
          width="1600"
          height="900"
          loading="lazy"
        />
        <div className="creator-content reveal">
          <span className="section-kicker">
            07 / THE HUMAN BEHIND THE CHAOS
          </span>
          <h2>
            他俩负责闹。
            <br />
            我负责<span>创造。</span>
          </h2>
          <p className="creator-name">
            你好，我是拯。
            <ArrowUpRight size={34} />
          </p>
          <p>
            墩墩和噗噗的原创设计师。
            <br />
            把一点无厘头，和很多很多陪伴，
            <br />
            装进两个毛茸茸的小家伙里。
          </p>
          <span className="signature">拯 / ZEN</span>
        </div>
        <span className="creator-sticker">
          幕后那位
          <br />
          终于出现了 ↗
        </span>
      </section>
      <footer>
        <div className="footer-top">
          <p>
            今日待办：
            <br />
            <strong>
              和好朋友，<span>一起没事找事。</span>
            </strong>
          </p>
          <a href="#home" className="back-top" aria-label="返回顶部">
            <ArrowUpRight size={35} />
          </a>
        </div>
        <Image
          unoptimized
          className="peek"
          src="/media/peek.png"
          alt="墩墩和噗噗一起探头"
          width="1024"
          height="1024"
          loading="lazy"
        />
        <div className="footer-brand">
          DUNDUN<span>&</span>PUPU
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} 墩墩和噗噗 · 原创 IP</span>
          <span>DESIGNED WITH A LITTLE CHAOS. BY 拯</span>
          <span>友情持续营业中 ●</span>
        </div>
      </footer>
    </main>
  );
}
