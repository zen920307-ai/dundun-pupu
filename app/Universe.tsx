'use client';
import { useEffect, useRef, useState } from 'react';
import Image from './IPImage';
import Playground from './Playground';
import gsap from 'gsap';
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  X,
  Zap,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
const moods = [
  {
    title: '拒绝内耗。选择外耗。',
    sub: '墩墩：别问。问就是在省电。',
    image: 1,
    tag: '今日电量 3%',
    reply: '噗噗：那我给你充一点！',
  },
  {
    title: '快乐到，忘记收敛。',
    sub: '噗噗：今天没什么，就是特别开心。',
    image: 5,
    tag: '快乐浓度 200%',
    reply: '墩墩：行吧。分我一点。',
  },
  {
    title: '嘴上嫌弃，手没松开。',
    sub: '墩墩：我只是刚好路过你旁边。',
    image: 40,
    tag: '嘴硬指数 MAX',
    reply: '噗噗：那明天也刚好路过！',
  },
  {
    title: '正在努力……努力躺好。',
    sub: '一起摸鱼，也是团队协作。',
    image: 31,
    tag: '营业状态：明天再说',
    reply: '噗噗：这个项目，我跟了。',
  },
  {
    title: '社交电量：只够点头。',
    sub: '墩墩：我在听。眼睛先休息。',
    image: 1,
    tag: '社交电量 8%',
    reply: '噗噗：点头也算聊天！',
  },
  {
    title: '突然想当一朵云。',
    sub: '噗噗：飘到哪里，就陪你到哪里。',
    image: 5,
    tag: '云朵模式 ON',
    reply: '墩墩：那我当你的阴影。',
  },
  {
    title: '今天的脑袋是空的。',
    sub: '空空的，刚好装下晚饭。',
    image: 31,
    tag: '脑内空间 99%',
    reply: '噗噗：留一点给我！',
  },
  {
    title: '不想长大，申请延期。',
    sub: '申请理由：朋友还没玩够。',
    image: 40,
    tag: '成年缓冲中',
    reply: '墩墩：批准，有效期一万年。',
  },
];
const archive = [
  [6, '数码小确幸', '手机也想有个搭子'],
  [37, '毛绒抱抱分队', '抱一下，问题明天再说'],
  [25, '随身挂件', '出门必须带家属'],
  [29, '穿上小快乐', '今天穿一点不正经'],
  [19, '包袋出逃计划', '把可爱打包带走'],
  [33, '桌面小同事', '不干活，只负责陪你'],
  [12, '限定礼盒', '一份装得下的偏心'],
  [27, '出行装备', '去哪里都一起'],
  [20, '服饰系列', '让今天软乎一点'],
  [44, '亚克力小分身', '小小一个，存在感很大'],
  [28, '包装脑洞', '盒子里面，藏着好朋友'],
  [54, '文具胡闹局', '上班也要偷偷可爱'],
] as const;
const stickers = [
  'dundun-sticker.png',
  'pupu-sticker.png',
  'keychain-sticker.png',
  'duo.png',
  'peek.png',
];
const scenes = [
  {
    image: 3,
    title: '春天：一起慢吞吞。',
    text: '今天的KPI：把春天坐穿。',
    season: 'SPRING / 慢一点',
  },
  {
    image: 24,
    title: '月圆：脑袋空空也很圆满。',
    text: '有些话不用讲，点心要分一半。',
    season: 'MOONLIGHT / 黏一点',
  },
  {
    image: 18,
    title: '冬天：有你就冒热气。',
    text: '锅里咕嘟，旁边噗噗。',
    season: 'WINTER / 暖一点',
  },
];
export default function Universe({ motion }: { motion: boolean }) {
  const [mood, setMood] = useState(0),
    [active, setActive] = useState<number | null>(null),
    [chaos, setChaos] = useState(false),
    [fortune, setFortune] = useState('今天适合：和好朋友一起虚度。');
  const board = useRef<HTMLDivElement>(null),
    moodTween = useRef<gsap.core.Timeline | null>(null),
    burst = useRef<HTMLDivElement>(null),
    burstTween = useRef<gsap.core.Tween | null>(null);
  useEffect(
    () => () => {
      moodTween.current?.kill();
      burstTween.current?.kill();
    },
    [],
  );
  useEffect(() => {
    if (!motion) {
      moodTween.current?.kill();
      burstTween.current?.kill();
      if (board.current)
        gsap.set(board.current, { clearProps: 'transform,opacity' });
    }
  }, [motion]);
  const choose = (next: number) => {
    moodTween.current?.kill();
    if (!motion || !board.current) {
      setMood(next);
      return;
    }
    moodTween.current = gsap
      .timeline()
      .to(board.current, { x: -25, rotation: -2, opacity: 0, duration: 0.18 })
      .call(() => setMood(next))
      .set(board.current, { x: 35, rotation: 3 })
      .to(board.current, {
        x: 0,
        rotation: 0,
        opacity: 1,
        duration: 0.55,
        ease: 'back.out(1.6)',
      });
  };
  const goNonsense = () => {
    setChaos((v) => !v);
    const fortunes = [
      '今天适合：一本正经地胡说八道。',
      '友情提醒：你的可爱已超速。',
      '今日宜：和好朋友集体掉线。',
      '宇宙回复：没关系，先吃一口。',
      '今日成就：什么都没干，但一起。',
    ];
    setFortune(fortunes[Math.floor(Math.random() * fortunes.length)]);
    if (motion && burst.current) {
      burstTween.current?.kill();
      burstTween.current = gsap.fromTo(
        burst.current.children,
        { y: 80, opacity: 0, scale: 0.5 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotation: () => gsap.utils.random(-18, 18),
          stagger: 0.06,
          duration: 0.7,
          ease: 'elastic.out(1,.55)',
        },
      );
    }
  };
  const chosen = active === null ? null : archive[active];
  return (
    <>
      <section className="mood-lab section" id="moods">
        <div className="section-kicker reveal">
          <span>02 / MOOD RECEPTION DESK</span>
          <span>情绪不稳定？我们很稳定地不稳定。</span>
        </div>
        <div className="lab-heading reveal">
          <h2>
            今天，
            <br />
            你是哪种<span>不想营业？</span>
          </h2>
          <span className="paper-label">
            允许摆烂
            <br />
            禁止不开心也硬撑
          </span>
        </div>
        <div className="mood-layout">
          <div className="mood-menu reveal">
            <span className="tiny-label">请选择你的精神状态 ↓</span>
            {[
              '墩墩式省电',
              '噗噗式快乐',
              '嘴硬式贴贴',
              '双人式摸鱼',
              '云朵式放空',
              '社交式点头',
              '晚饭式认真',
              '延期式长大',
            ].map((m, i) => (
              <button
                key={m}
                className={mood === i ? 'mood-choice selected' : 'mood-choice'}
                aria-pressed={mood === i}
                onClick={() => choose(i)}
              >
                <span>0{i + 1}</span>
                {m}
                <ArrowUpRight size={22} />
              </button>
            ))}
            <button
              className="random-mood"
              onClick={() =>
                choose((mood + 1 + Math.floor(Math.random() * 3)) % 4)
              }
            >
              <Shuffle size={18} /> 我也不知道，随机发疯
            </button>
          </div>
          <div className="mood-display reveal" ref={board}>
            <div className="mood-sheet">
              <Image
                unoptimized
                src={'/media/' + stickers[mood % stickers.length]}
                width={990}
                height={1400}
                alt={moods[mood].title + '角色贴纸'}
                loading="lazy"
              />
            </div>
            <div className="mood-report" aria-live="polite">
              <span className="mood-tag">{moods[mood].tag}</span>
              <h3>{moods[mood].title}</h3>
              <p>{moods[mood].sub}</p>
              <span className="speech-reply">{moods[mood].reply}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="friendship-trip" id="trip">
        <div className="trip-heading section">
          <span className="section-kicker reveal">
            03 / SAME FRIEND. DIFFERENT NONSENSE.
          </span>
          <h2 className="reveal">
            季节随便换。
            <br />
            <span>搭子不换。</span>
          </h2>
          <p className="reveal">
            春天、月亮、热乎乎的冬天。
            <br />
            去哪儿不重要，重要的是「我们」。
          </p>
        </div>
        <div className="trip-track">
          {scenes.map((s, i) => (
            <article className={'trip-panel trip-panel-' + i} key={s.image}>
              <Image
                unoptimized
                src={'/media/archive-' + s.image + '.webp'}
                width={1400}
                height={788}
                alt={s.title}
                loading="lazy"
              />
              <div className="trip-panel-shade" />
              <span className="trip-season">{s.season}</span>
              <div className="trip-copy">
                <span className="trip-index">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
              <span className="trip-sticker">
                无所事事
                <br />
                但在一起
              </span>
            </article>
          ))}
        </div>
      </section>
      <Playground motion={motion} />
      <section className={'nonsense section ' + (chaos ? 'nonsense-on' : '')}>
        <div className="section-kicker reveal">
          <span>PLEASE DO NOT PRESS THIS BUTTON.</span>
          <span>友情提示：本按钮没有正经用途。</span>
        </div>
        <div className="nonsense-content">
          <div className="reveal">
            <h2>
              都看到这里了。
              <br />
              不如<span>发个疯？</span>
            </h2>
            <p>
              世界已经够严肃了。
              <br />
              留一小块地方，给没用但快乐的事。
            </p>
          </div>
          <button
            className="chaos-button"
            onClick={goNonsense}
            aria-pressed={chaos}
          >
            <Zap size={34} />
            <strong>{chaos ? '再离谱一点' : '离谱开关'}</strong>
            <span>PUSH FOR ABSOLUTELY NOTHING</span>
          </button>
        </div>
        <div className="chaos-burst" ref={burst} aria-hidden="true">
          {[
            '班可以上 / 脑子先下班',
            '严肃暂停！',
            '噗噗批准了',
            '墩墩：？',
            '友情不限流量',
          ].map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <p className="fortune" aria-live="polite">
          {fortune}
        </p>
      </section>
      <section className="archive section" id="archive">
        <div className="section-kicker reveal">
          <span>05 / THE INVASION OF CUTENESS</span>
          <span>注意：他们已经无处不在。</span>
        </div>
        <div className="archive-heading reveal">
          <h2>
            从你的怀里，
            <br />
            到你的<span>全世界。</span>
          </h2>
          <p>
            包上、桌上、衣服上。
            <br />
            这两个家伙，真的很会找地方待着。
            <br />
            <span>戳任意小家伙，打开对应设计稿 ↗</span>
          </p>
        </div>
        <div className="archive-grid">
          <span className="wall-scribble" aria-hidden="true">
            到处都是我们。
            <br />
            你被可爱包围了 ↘
          </span>
          {archive.map(([id, title, note], i) => (
            <button
              className={'archive-card archive-card-' + i + ' reveal'}
              key={id}
              onClick={() => setActive(i)}
            >
              <div className="archive-photo">
                <Image
                  unoptimized
                  className="archive-cutout"
                  src={'/media/archive-' + id + '.webp'}
                  width={990}
                  height={1400}
                  alt={title}
                  loading="lazy"
                />
                <Image
                  unoptimized
                  className="archive-sticker"
                  src={'/media/' + stickers[i % stickers.length]}
                  width={180}
                  height={180}
                  alt=""
                  aria-hidden="true"
                />
                <span className="archive-open">
                  <Plus size={23} />
                </span>
              </div>
              <span className="archive-no">
                发现 #{String(i + 1).padStart(2, '0')}
              </span>
              <strong>{title}</strong>
              <span className="archive-note">{note}</span>
            </button>
          ))}
        </div>
        <div className="archive-end reveal">
          <span>可爱还在继续繁殖。</span>
          <span>TO BE CONTINUED… ↗</span>
        </div>
      </section>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent className="art-dialog" showCloseButton={false}>
          <div className="art-dialog-top">
            <DialogTitle>{chosen?.[1] ?? '原创设计'}</DialogTitle>
            <DialogClose className="dialog-close" aria-label="关闭大图">
              <X size={24} />
            </DialogClose>
          </div>
          <DialogDescription className="art-description">
            {chosen?.[2]} · 设计师拯的原创 IP 设计稿
          </DialogDescription>
          {chosen && (
            <Image
              unoptimized
              className="art-full"
              src={'/media/archive-' + chosen[0] + '.webp'}
              alt={chosen[1]}
              width={1400}
              height={1400}
            />
          )}
          <div className="art-dialog-controls">
            <button
              onClick={() =>
                setActive((v) =>
                  v === null ? 0 : (v - 1 + archive.length) % archive.length,
                )
              }
              aria-label="上一张设计稿"
            >
              <ArrowLeft size={20} />
              上一张
            </button>
            <span>
              {(active ?? 0) + 1} / {archive.length}
            </span>
            <button
              onClick={() =>
                setActive((v) => (v === null ? 0 : (v + 1) % archive.length))
              }
              aria-label="下一张设计稿"
            >
              下一张
              <ArrowRight size={20} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
