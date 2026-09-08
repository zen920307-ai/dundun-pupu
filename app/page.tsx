'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Image from './IPImage';
import Universe from './Universe';
import Origin from './Origin';
import SiteHeader from './SiteHeader';
import { INTRO_VIDEO } from './content';
import { pokeLines, shuffledDeck } from './playful-content';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowUpRight,
  ArrowDown,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const pokeDeck = useRef(shuffledDeck(pokeLines.length));
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
          y: 35,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }),
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
          y: 24,
          rotation: i % 2 ? 2 : -2,
          scale: 0.96,
          duration: 0.7,
          ease: 'back.out(1.6)',
          scrollTrigger: {
            trigger: el,
            start: 'top 94%',
            toggleActions: 'play none none reverse',
          },
        }),
      );
    }, root);
    let mounted = true;
    void document.fonts.ready.then(() => {
      if (mounted) ScrollTrigger.refresh();
    });
    return () => {
      mounted = false;
      ctx.revert();
    };
  }, [motion]);
  const poke = () => {
    setLine(pokeLines[pokeDeck.current()]);
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
    <main ref={root} data-motion={motion}>
      <a className="skip" href="#duo">
        跳到角色介绍
      </a>
      <SiteHeader motion={motion} onMotionChange={() => setMotion(!motion)} />
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
        <div className="video-controls" data-silent>
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
          {[0, 1].map((copy) => (
            <span className="ticker-copy" key={copy}>
              {[
                '没头脑 & 不高兴？',
                '是最好最好的朋友！',
                'DUNDUN & PUPU',
                '不太正经，但超要好',
                '一个不想营业，一个非要贴贴',
                '允许摆烂 · 禁止硬撑',
                '友情不限流量',
                '全世界催你长大，我们陪你傻一下',
                '今日待办：一起没事找事',
                '噗噗批准了 · 墩墩：？',
                '贴贴是刚需',
                'EST. FRIENDS FOREVER',
              ].map((bit) => (
                <span className="ticker-bit" key={bit}>
                  {bit}
                  <i>✳</i>
                </span>
              ))}
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
      <section className="travel-entry section" aria-labelledby="travel-entry-title">
        <div className="travel-entry-copy reveal">
          <span className="travel-label">2016 — 2026 / 好朋友出逃实录</span>
          <h2 id="travel-entry-title">世界那么大。<br /><span>一起闯点祸。</span></h2>
          <p>20 段旅程，一对最佳损友。<br />有白崖、有极光色的梦，还有一把死活打不开门的钥匙。</p>
          <Link href="/travel" className="travel-cta">拆开出逃档案 <ArrowUpRight size={24} /></Link>
          <span className="travel-entry-note">墩墩：丢脸的部分可以不写吗？<br />噗噗：已经加粗了。</span>
        </div>
        <Link href="/travel" className="travel-entry-art reveal" aria-label="查看全部 20 份出逃档案">
          <Image src="/travel/英国伦敦-thumb.webp" width={480} height={720} alt="英国伦敦旅行海报" loading="lazy" />
          <Image src="/travel/冰岛环岛-thumb.webp" width={480} height={640} alt="冰岛环岛旅行海报" loading="lazy" />
          <span className="travel-entry-stamp">搭子不换<br />地图接着翻 ↗</span>
        </Link>
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
      <section className="world-portals section" id="explore">
        <div className="section-kicker reveal">
          <span>06 / MORE LITTLE WORLDS</span>
          <span>可爱还有两个分会场。</span>
        </div>
        <div className="portal-heading reveal">
          <h2>
            还没玩够？
            <br />
            <span>再开两扇门。</span>
          </h2>
          <p>
            大脑洞，放大看。
            <br />
            小快乐，随身带。
          </p>
        </div>
        <div className="portal-grid">
          <Link className="portal portal-kv reveal" href="/kv">
            <div className="portal-visual">
              <Image
                src="/gallery/kv/08.webp"
                width={1672}
                height={941}
                alt="墩墩和噗噗的积木乐园主视觉"
                loading="lazy"
              />
            </div>
            <span className="portal-tag">21 张原创主视觉</span>
            <h3>
              脑洞巨幕厅 <ArrowUpRight size={30} />
            </h3>
            <p>今天开始，认真地不务正业。</p>
          </Link>
          <Link className="portal portal-wallpapers reveal" href="/wallpapers">
            <div className="wp-fill" aria-hidden="true">
              {[
                '01',
                '03',
                '05',
                '08',
                '14',
                '18',
                '21',
                '24',
              ].map((id) => (
                <Image
                  key={id}
                  src={'/gallery/wallpapers/' + id + '-thumb.webp'}
                  width={841}
                  height={1870}
                  alt=""
                  loading="lazy"
                />
              ))}
            </div>
            <span className="wp-tape" aria-hidden="true" />
            <span className="wp-stamp">
              掉了
              <br />
              请闪光
            </span>
            <div className="wp-board">
              <figure className="wp-shot s1">
                <Image
                  src="/gallery/wallpapers/04-thumb.webp"
                  width={841}
                  height={1870}
                  alt="涂鸦墙角手机壁纸"
                  loading="lazy"
                />
              </figure>
              <figure className="wp-shot s2">
                <Image
                  src="/gallery/wallpapers/07-thumb.webp"
                  width={841}
                  height={1870}
                  alt="涂鸦贴贴手机壁纸"
                  loading="lazy"
                />
              </figure>
              <figure className="wp-shot s3">
                <Image
                  src="/gallery/wallpapers/12-thumb.webp"
                  width={841}
                  height={1870}
                  alt="耳机里的墩墩和噗噗壁纸"
                  loading="lazy"
                />
              </figure>
              <Image
                unoptimized
                className="wp-buddy dundun"
                src="/media/stickers/dundun-head.png"
                width={200}
                height={220}
                alt=""
              />
              <Image
                unoptimized
                className="wp-buddy pupu"
                src="/media/pupu-sticker.png"
                width={140}
                height={160}
                alt=""
              />
              <span className="wp-note">
                不是广告
                <br />
                是家属
              </span>
            </div>
            <div className="portal-wallpaper-copy">
              <span className="portal-tag">24 张 · 捡到请亮屏</span>
              <h3>
                锁屏搭子招领处 <ArrowUpRight size={28} />
              </h3>
              <p>谁的锁屏掉在这里了？先认领一只。</p>
            </div>
          </Link>
        </div>
      </section>
      <section className="creator" id="creator">
        <div className="creator-inner">
          <Image
            unoptimized
            className="creator-portrait"
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
          <Image
            className="creator-mascot"
            src="/media/dundun-sticker.png"
            width={170}
            height={190}
            alt=""
          />
          <span className="creator-sticker">
            幕后那位
            <br />
            终于出现了 ↗
          </span>
        </div>
      </section>
      <Origin motion={motion} />
      <footer>
        <div className="footer-inner">
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
        </div>
      </footer>
    </main>
  );
}
