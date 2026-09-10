'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUpRight, MapPin, Plus, Ticket, X } from 'lucide-react';
import SiteHeader from '../SiteHeader';
import Image from '../IPImage';
import { trips } from './trips';

export default function TravelJournal() {
  const root = useRef<HTMLElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const [motion, setMotion] = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; place: string; date: string } | null>(null);

  useEffect(() => {
    // 动效默认开，不受系统 prefers-reduced-motion 影响；关闭只走页头开关（data-motion）
  }, []);
  useEffect(() => {
    if (!motion) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from('.travel-intro', { y: 36, opacity: 0, stagger: .12, duration: .8, ease: 'power3.out' });
      gsap.from('.travel-hero-posters', { y: 50, rotation: 4, opacity: 0, duration: 1, ease: 'power3.out' });
      gsap.utils.toArray<HTMLElement>('.trip-card').forEach(el => {
        gsap.from(el, { y: 30, opacity: 0, duration: .65, scrollTrigger: { trigger: el, start: 'top 95%', once: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [motion]);

  const closeLightbox = useCallback(() => lightboxRef.current?.close(), []);
  useEffect(() => {
    const dialog = lightboxRef.current;
    if (!dialog || !lightbox) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [lightbox]);

  return (
    <main ref={root} className="travel-page" data-motion={motion}>
      <a className="skip" href="#travel-archive">跳到出逃档案</a>
      <SiteHeader active="travel" motion={motion} onMotionChange={() => setMotion(!motion)} />
      <section className="travel-hero">
        <div className="travel-hero-copy">
          <p className="travel-label travel-intro">DUNDUN &amp; PUPU / ON THE ROAD</p>
          <h1 className="travel-intro">不赶路。<br />赶<span>快乐。</span><i>偶尔也赶演唱会。</i></h1>
          <p className="travel-intro travel-lead">两位最佳损友的出逃档案。<br />世界负责壮阔，我们负责出糗。</p>
          <div className="travel-hero-actions travel-intro"><a className="travel-cta" href="#travel-archive">拆开 20 份出逃档案 <ArrowDown size={20} /></a><a className="travel-origin-link" href="#trip-yunnan"><Ticket size={19} aria-hidden="true" />从第一次出发读起</a></div>
          <div className="travel-pass travel-intro"><span>搭子编号 <strong>DD + PP</strong></span><span>同行记录 <strong>2016 — 2026</strong></span><span>行李清单 <strong>快乐 / 笑料 / 彼此</strong></span></div>
        </div>
        <div className="travel-hero-posters">
          <div className="travel-orbit" aria-hidden="true">目的地会换 · 搭子不换 ·</div>
          <Image className="travel-poster-back" src="/travel/英国伦敦-thumb.webp" width={480} height={720} alt="伦敦的旅行回忆" />
          <a href="#trip-iceland" className="travel-poster-front">
            <Image src="/travel/冰岛环岛.webp" width={1086} height={1448} alt="墩墩和噗噗的冰岛环岛旅行海报" preload />
            <span><b>本期翻车现场</b>冰岛 · 钥匙没丢，智慧离家出走 ↗</span>
          </a>
          <span className="travel-hero-note">“你把钥匙放哪了？”<br />“这个问题很有深度。”</span>
        </div>
      </section>
      <div className="travel-strip" aria-hidden="true"><span>好朋友 / 坏主意 / 好风景</span><span>TAKE MEMORIES. LEAVE BORING BEHIND.</span><span>出发就对了 ↗</span></div>
      <section className="travel-archive" id="travel-archive">
        <div className="travel-archive-heading"><div><p className="travel-label">THE VERY UNOFFICIAL ESCAPE FILES</p><h2>一路风景。<span>一路笑柄。</span></h2></div><p>20 张旅行海报 / 20 段同行记忆<br />日期按旅行月份记录，故事由近到远。</p></div>
        <nav className="travel-years" aria-label="按旅行年份跳转"><span>翻到哪年？</span>{[...new Set(trips.map(trip => trip.date.slice(0,4)))].map(year => <a key={year} href={'#trip-' + trips.find(trip => trip.date.startsWith(year))!.id}>{year}<ArrowDown size={14}/></a>)}</nav>
        <p className="travel-editor-note">真实同行记忆 × 搞怪文字演绎。对话和部分场景为创作补写，不是现场逐字实录。</p>
        <div className="travel-grid">
          {trips.map((trip, index) => <article className="trip-card" id={'trip-' + trip.id} key={trip.id}>
            <div className="trip-card-top"><span>出逃档案 / {String(index + 1).padStart(2,'0')}</span><time dateTime={trip.date.replace('.', '-')}>{trip.date}</time></div>
            <div className="trip-overview">
              <button type="button" className="trip-photo" onClick={() => setLightbox({ src: '/travel/' + trip.place + '.webp', place: trip.place, date: trip.date })} aria-label={'放大查看' + trip.place + '完整海报'} aria-haspopup="dialog">
                <Image src={'/travel/' + trip.place + '-thumb.webp'} width={480} height={trip.id === 'iceland' ? 640 : 720} alt={'墩墩和噗噗 · ' + trip.place + '旅行海报'} loading="lazy" />
                <span>点我看大海报 <ArrowUpRight size={16}/></span>
              </button>
              <div className="trip-intro">
                <div className="trip-intro-meta">
                  <span className="trip-tag">{trip.tag}</span>
                  <span className="trip-mode">{trip.mode}</span>
                </div>
                <p className="trip-place"><MapPin size={15}/>{trip.place}</p>
                <h3>{trip.title}</h3>
                <p className="trip-route">{trip.route}</p>
                <div className="trip-dialogue">
                  <span className="travel-label">损友小剧场 / 请勿当真</span>
                  <div className="trip-dialogue-lines">
                    {trip.talk.map((line, i) => {
                      const isDundun = line.startsWith('墩墩');
                      return (
                        <div className={'dlg-row ' + (isDundun ? 'dlg-dundun' : 'dlg-pupu')} key={i}>
                          <span className="dlg-avatar" aria-hidden="true">
                            <Image src={isDundun ? '/media/avatar-dundun.jpg' : '/media/avatar-pupu.jpg'} width={72} height={72} alt="" loading="lazy" />
                          </span>
                          <p className="dlg-bubble">{line.slice(3)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <details className="trip-story" onToggle={() => ScrollTrigger.refresh()}>
              <summary><span className="trip-read-closed">翻开这篇日记</span><span className="trip-read-open">收起日记</span><Plus size={22}/></summary>
              <div className="trip-story-body">{trip.story.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<p className="trip-receipt">{trip.receipt}</p></div>
            </details>
          </article>)}
        </div>
      </section>
      <section className="travel-ending"><Image src="/media/duo.webp" width={300} height={300} alt="最好的朋友，墩墩和噗噗" loading="lazy"/><div><p className="travel-label">TO BE CONTINUED…</p><h2>下一站还没定。<br /><span>搭子，早就定了。</span></h2><a className="travel-cta" href="/">回家继续胡闹 <ArrowUpRight size={20}/></a></div></section>
      <div className="travel-colophon"><span>墩墩和噗噗 · 原创 IP BY 拯</span><a href="#travel-archive">再翻一遍 ↑</a><span>友情持续营业中</span></div>
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- native modal dialog: ESC handled by the browser */}
      <dialog
        ref={lightboxRef}
        className="lightbox-dialog"
        aria-label={lightbox ? lightbox.place + '完整海报' : undefined}
        onClick={event => { if (event.target === lightboxRef.current) closeLightbox(); }}
        onClose={() => setLightbox(null)}
      >
        {lightbox && (
          <figure className="lightbox-figure">
            <button type="button" className="lightbox-close" onClick={closeLightbox} aria-label="关闭海报"><X size={20} /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.src} alt={'墩墩和噗噗 · ' + lightbox.place + '旅行海报完整版'} />
            <figcaption className="lightbox-caption"><b>{lightbox.place}</b><span>出逃时间 {lightbox.date}</span></figcaption>
          </figure>
        )}
      </dialog>
    </main>
  );
}
