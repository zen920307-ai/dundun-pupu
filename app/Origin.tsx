'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from './IPImage';
import { shuffledDeck } from './playful-content';

const dundunBits = [
  '该乘客已进入睡眠模式。',
  '饭后请勿剧烈登机。',
  '北纬 66° 认证困倦。',
  '橙帽子：冰岛限量友情款。',
  '下一班：等我睡醒。',
];
const pupuBits = [
  '精力超标，无法托运。',
  '姓唐。是鸭子。有意见？',
  '旅游搭子，负责把困倦那位喊起来。',
  '今日步数：已经超标。',
  '窗口位已占，请贴贴。',
];

function Pass({
  who,
  motion,
}: {
  who: 'dundun' | 'pupu';
  motion: boolean;
}) {
  const isDundun = who === 'dundun';
  const deck = useRef(shuffledDeck(isDundun ? dundunBits.length : pupuBits.length));
  const [line, setLine] = useState(
    isDundun ? '戳吊牌或登机牌，办理困倦。' : '戳吊牌或登机牌，办理蹦哒。',
  );
  const [boarded, setBoarded] = useState(false);
  const card = useRef<HTMLElement>(null);
  const tag = useRef<HTMLButtonElement>(null);
  const stamp = useRef<HTMLSpanElement>(null);
  const scan = useRef<HTMLSpanElement>(null);
  const idle = useRef<gsap.core.Tween | null>(null);
  const bits = isDundun ? dundunBits : pupuBits;
  const startIdle = () => {
    idle.current?.kill();
    if (!motion || !tag.current) return;
    idle.current = gsap.to(tag.current, {
      rotation: isDundun ? -14 : 14,
      duration: 2.1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      transformOrigin: '50% 6%',
    });
  };
  useEffect(() => {
    startIdle();
    return () => {
      idle.current?.kill();
    };
  }, [motion]);
  const board = () => {
    setLine(bits[deck.current()]);
    setBoarded(true);
    if (!motion) return;
    idle.current?.kill();
    if (tag.current)
      gsap.fromTo(
        tag.current,
        { rotation: isDundun ? -26 : 26, y: -16 },
        {
          rotation: isDundun ? -8 : 8,
          y: 0,
          duration: 1.15,
          ease: 'elastic.out(1, 0.38)',
          transformOrigin: '50% 6%',
          onComplete: startIdle,
        },
      );
    if (card.current)
      gsap.fromTo(
        card.current,
        { x: isDundun ? -18 : 18, rotation: isDundun ? -3 : 3 },
        { x: 0, rotation: isDundun ? -1.2 : 1.2, duration: 0.45, ease: 'power2.out' },
      );
    if (stamp.current)
      gsap.fromTo(
        stamp.current,
        { scale: 2.4, opacity: 0, rotation: -40 },
        { scale: 1, opacity: 1, rotation: -18, duration: 0.55, ease: 'back.out(2.4)' },
      );
    if (scan.current)
      gsap.fromTo(
        scan.current,
        { y: 12, opacity: 0.9 },
        { y: 280, opacity: 0, duration: 0.7, ease: 'power1.in' },
      );
  };
  const tilt = (event: React.PointerEvent<HTMLElement>) => {
    if (!motion || event.pointerType !== 'mouse' || !card.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card.current, {
      rotateY: x * 12,
      rotateX: -y * 8,
      duration: 0.25,
      overwrite: 'auto',
    });
  };
  const untilt = () => {
    if (!card.current) return;
    gsap.to(card.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.45,
      ease: 'power2.out',
    });
  };
  return (
    <article
      ref={card}
      className={'origin-card ' + (isDundun ? 'dundun-origin' : 'pupu-origin')}
      onPointerMove={tilt}
      onPointerLeave={untilt}
      onClick={board}
    >
      <button
        ref={tag}
        type="button"
        className="origin-tag"
        aria-label={isDundun ? '戳戳墩墩行李吊牌' : '戳戳噗噗行李吊牌'}
        onClick={(event) => {
          event.stopPropagation();
          board();
        }}
      >
        <Image
          unoptimized
          src={isDundun ? '/media/dundun-tag.png' : '/media/pupu-tag.png'}
          width={1254}
          height={1254}
          alt={isDundun ? '墩墩行李吊牌' : '噗噗行李吊牌'}
        />
      </button>
      <span className="origin-scan" ref={scan} aria-hidden="true" />
      <span
        ref={stamp}
        className={'origin-stamp' + (boarded ? ' show' : '')}
      >
        {isDundun ? '已登机' : '已蹦哒'}
      </span>
      <div className="pass-main">
        <div className="pass-top">
          <span>BOARDING PASS</span>
          <strong>{isDundun ? 'DUNDUN AIR' : 'PUPU AIR'}</strong>
        </div>
        <div className="pass-meta">
          <span>
            PASSENGER
            <b>{isDundun ? '好基友 / DUNDUN' : '拯 / PUPU'}</b>
          </span>
          <span>
            FLIGHT
            <b>{isDundun ? 'ICE 066' : 'TANG 01'}</b>
          </span>
        </div>
        <p className="pass-route">
          {isDundun ? '被窝' : '工位'} <i>→</i> {isDundun ? '冰岛' : '到处'}
        </p>
        <span className="origin-who">
          {isDundun ? '原型 · 我的好基友' : '原型 · 我自己'}
        </span>
        <h3>{isDundun ? '墩墩是他。' : '噗噗是我。'}</h3>
        <p>
          {isDundun
            ? '肤色深一点点，常年走在犯困的路上。吃完饭，人就准备关机。那顶橙帽子，是我们去冰岛时，我塞给他的北纬66°羊毛帽。他戴上的那一秒，我觉得：对，就是这个人。'
            : '我姓唐，精力有点过剩，每天都想出门蹦哒。唐老鸭？那就做一只更软、更黏人的鸭子。负责贴贴，也负责把犯困的那位，从被窝里喊起来。'}
        </p>
        <output className="origin-blip">{line}</output>
        <span className="pass-bars" aria-hidden="true" />
      </div>
      <aside className="pass-stub">
        <span>GATE</span>
        <b>{isDundun ? '困' : '蹦'}</b>
        <span>SEAT</span>
        <b>{isDundun ? '沙发' : '窗边'}</b>
        <span>DATE</span>
        <b>{isDundun ? '随时' : '现在'}</b>
      </aside>
    </article>
  );
}

export default function Origin({ motion }: { motion: boolean }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!motion || !root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from('.origin-belt span', {
        y: 24,
        opacity: 0,
        rotation: () => gsap.utils.random(-18, 18),
        stagger: 0.06,
        duration: 0.6,
        ease: 'back.out(1.8)',
        scrollTrigger: { trigger: '.origin-belt', start: 'top 88%' },
      });
      gsap.from('.dundun-origin', {
        x: -120,
        rotation: -8,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.dundun-origin', start: 'top 86%' },
      });
      gsap.from('.pupu-origin', {
        x: 120,
        rotation: 8,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.pupu-origin', start: 'top 86%' },
      });
      gsap.from('.origin-tag', {
        y: -80,
        opacity: 0,
        duration: 0.8,
        delay: 0.25,
        stagger: 0.15,
        ease: 'bounce.out',
        scrollTrigger: { trigger: '.origin-grid', start: 'top 80%' },
      });
    }, root);
    return () => ctx.revert();
  }, [motion]);
  return (
    <section className="origin section" id="origin" ref={root}>
      <div className="section-kicker reveal">
        <span>08 / TWO REAL PEOPLE</span>
        <span>灵感没有那么神秘。有点离谱。</span>
      </div>
      <div className="origin-heading reveal">
        <h2>
          他们是怎么
          <br />
          <span>长出来的？</span>
        </h2>
        <p>
          我们都爱旅游，所以成了最好的朋友，也成了旅游搭子。
          <br />
          一个想睡觉，一个想出门。这段友情，被我办成了两张登机牌。
        </p>
      </div>
      <div className="origin-belt" aria-hidden="true">
        {['已安检', '请勿叫醒', '准予犯困', '精力超标', '冰岛直飞', '友情不限重'].map(
          (label) => (
            <button
              key={label}
              type="button"
              onClick={(event) => {
                if (!motion) return;
                gsap.fromTo(
                  event.currentTarget,
                  { y: -18, rotation: gsap.utils.random(-16, 16) },
                  { y: 0, rotation: gsap.utils.random(-6, 6), duration: 0.55, ease: 'elastic.out(1,.5)' },
                );
              }}
            >
              {label}
            </button>
          ),
        )}
      </div>
      <div className="origin-grid">
        <Pass who="dundun" motion={motion} />
        <Pass who="pupu" motion={motion} />
      </div>
      <p className="origin-foot reveal">
        都爱出门，所以变成了最好的朋友，也变成了旅游搭子。点登机牌，办理登机。
      </p>
    </section>
  );
}
