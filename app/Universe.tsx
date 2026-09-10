'use client';
import { useEffect, useRef, useState } from 'react';
import Image from './IPImage';
import Sticker from './Sticker';
import { soundCue } from './sound';
import { downloadAsPng } from './download';
import Playground from './Playground';
import FestivalGallery from './FestivalGallery';
import {
  moodExtras,
  fortunes,
  chaosTags,
  shuffledDeck,
  drawRound,
} from './playful-content';
import gsap from 'gsap';
import {
  ArrowLeft,
  ArrowRight,
  Download,
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
const baseMoods = [
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
  [26, '随身挂件', '出门必须带家属'],
  [29, '穿上小快乐', '今天穿一点不正经'],
  [21, '包袋出逃计划', '把可爱打包带走'],
  [54, '桌面小同事', '不干活，只负责陪你'],
  [12, '限定礼盒', '一份装得下的偏心'],
  [27, '出行装备', '去哪里都一起'],
  [30, '表情包分身', '废话不多，一张就懂'],
  [44, '亚克力小分身', '小小一个，存在感很大'],
  [28, '包装脑洞', '盒子里面，藏着好朋友'],
  [53, '零食补给站', '把今天的快乐拆开吃'],
] as const;
const labels = [
  '墩墩式省电',
  '噗噗式快乐',
  '嘴硬式贴贴',
  '双人式摸鱼',
  '社交式点头',
  '云朵式放空',
  '晚饭式认真',
  '延期式长大',
];
const moods = [
  ...baseMoods.map((m, i) => ({ ...m, label: labels[i] })),
  ...moodExtras.map(([label, title, sub, tag, reply]) => ({
    label,
    title,
    sub,
    tag,
    reply,
    image: 0,
  })),
];
const moodScenes = [
  [['墩墩', '我今天只剩 3% 电。'], ['噗噗', '那我不开大灯，坐你旁边充。'], ['墩墩', '……只许坐一会儿。'], ['噗噗', '好，充满为止。']],
  [['噗噗', '我刚才对路边的云说了早上好！'], ['墩墩', '它回你了吗？'], ['噗噗', '它飘了一下，肯定是害羞。'], ['墩墩', '行。下次替我也问个好。']],
  [['墩墩', '我没有等你。'], ['噗噗', '那你为什么站在这里？'], ['墩墩', '这块地比较平。'], ['噗噗', '那我陪你一起站平。']],
  [['墩墩', '今天的待办：躺好。'], ['噗噗', '我负责把零食搬过来。'], ['墩墩', '这也算分工？'], ['噗噗', '我们是专业团队。']],
  [['墩墩', '我能听见，你小声点。'], ['噗噗', '那我眨眼跟你聊天？'], ['墩墩', '这个方案……可以。'], ['噗噗', '眨一下是“收到”！']],
  [['噗噗', '我们今天飘去哪里？'], ['墩墩', '飘到不用回消息的地方。'], ['噗噗', '那里有云朵沙发吗？'], ['墩墩', '有。给你留半边。']],
  [['墩墩', '我的脑袋空空的。'], ['噗噗', '正好，我有一盒薯片。'], ['墩墩', '这两件事有什么关系？'], ['噗噗', '空位不能浪费。']],
  [['噗噗', '长大申请我先撤回啦。'], ['墩墩', '理由？'], ['噗噗', '朋友还没陪我玩够。'], ['墩墩', '批准延期。没有截止日。']],
  [['墩墩', '奶茶要全糖。'], ['噗噗', '今天这么勇敢？'], ['墩墩', '生活已经够苦了。'], ['噗噗', '那我的珍珠也给你。']],
  [['噗噗', '你的灵魂去哪儿散步了？'], ['墩墩', '让它路过便利店。'], ['噗噗', '要不要我去接它？'], ['墩墩', '带饭回来就行。']],
  [['墩墩', '我现在像河豚。'], ['噗噗', '那我坐远一点点？'], ['墩墩', '不行。'], ['噗噗', '懂了，河豚也要贴贴。']],
  [['墩墩', '三米外有人开薯片。'], ['噗噗', '你怎么知道？'], ['墩墩', '我的耳朵只上这个班。'], ['噗噗', '那我给你留最大一片。']],
  [['墩墩', '今天星期几？'], ['噗噗', '周一。'], ['墩墩', '我不同意。'], ['噗噗', '那我们假装它还没来。']],
  [['噗噗', '这片叶子像我！'], ['墩墩', '哪里像？'], ['噗噗', '圆圆的，而且很快乐。'], ['墩墩', '……带回去认亲吧。']],
  [['墩墩', '我很忙。'], ['噗噗', '忙什么？'], ['墩墩', '给空气开会。'], ['噗噗', '那散会去吃饭。']],
  [['墩墩', '我只是路过八次。'], ['噗噗', '这条路有我吗？'], ['墩墩', '风景还行。'], ['噗噗', '那我每天都在这里。']],
  [['噗噗', '被子把我吸住了！'], ['墩墩', '科学问题。'], ['噗噗', '要不要一起研究？'], ['墩墩', '研究到明天。']],
  [['噗噗', '月亮会想吃宵夜吗？'], ['墩墩', '它挂那么晚，应该会。'], ['噗噗', '那我们给它留一口？'], ['墩墩', '先问冰箱同不同意。']],
  [['墩墩', '今天没进步。'], ['噗噗', '但你今天很可爱。'], ['墩墩', '这个也算业绩？'], ['噗噗', '我给你盖两个合格章。']],
  [['噗噗', '再挪两厘米！'], ['墩墩', '已经很近了。'], ['噗噗', '友情需要精准贴贴。'], ['墩墩', '再挪我就掉下去了。']],
  [['噗噗', '下雨了，出门取消吗？'], ['墩墩', '鞋替我们去吧。'], ['噗噗', '那我们听雨。'], ['墩墩', '顺便煮点面。']],
  [['噗噗', '别人比速度，我们比谁慢。'], ['墩墩', '我已经领先了。'], ['噗噗', '你根本没动。'], ['墩墩', '这就是技术。']],
  [['噗噗', '今天换我给你撑伞。'], ['墩墩', '你的胳膊够长吗？'], ['噗噗', '不够就挨近一点。'], ['墩墩', '……那我蹲下来。']],
  [['墩墩', '今天好像没发生什么。'], ['噗噗', '发生了我们在一起呀。'], ['墩墩', '这也算？'], ['噗噗', '这算珍藏版。']],
] as const;
// Actual transparent cutouts, derived from the original IP sticker artwork.
const moodStickerCovers = [
  '/media/stickers/mood-duo-huddle-cutout.webp',
  '/media/stickers/mood-sticker-02-cutout.webp',
  '/media/stickers/mood-sticker-03-cutout.webp',
  '/media/stickers/mood-sticker-04-cutout.webp',
  '/media/stickers/mood-sticker-05-cutout.webp',
  '/media/stickers/mood-sticker-06-cutout.webp',
  '/media/stickers/mood-sticker-07-cutout.webp',
  '/media/stickers/mood-sticker-08-cutout.webp',
] as const;
const dealMoodStickers = (draw: () => number, focus: number) => {
  const dealt = drawRound(draw, 4);
  if (!dealt.includes(focus)) dealt[0] = focus;
  return dealt;
};
const pickTags = (draw: () => number) =>
  drawRound(draw, 8).map((i) => chaosTags[i]);
export default function Universe({ motion }: { motion: boolean }) {
  const [mood, setMood] = useState(0),
    [active, setActive] = useState<number | null>(null),
    [chaos, setChaos] = useState(false),
    [fortune, setFortune] = useState('今天适合：和好朋友一起虚度。'),
    [tags, setTags] = useState<string[]>(() => chaosTags.slice(0, 8));
  const [drawId, setDrawId] = useState(0);
  const [stickerMoods, setStickerMoods] = useState([0, 1, 2, 3]);
  const [stickerArt, setStickerArt] = useState([0, 1, 2, 3]);
  const moodDeck = useRef(shuffledDeck(moods.length, 0));
  const stickerMoodDeck = useRef(shuffledDeck(moods.length, 3));
  const stickerArtDeck = useRef(shuffledDeck(moodStickerCovers.length, 3));
  const fortuneDeck = useRef(shuffledDeck(fortunes.length));
  const tagDeck = useRef(shuffledDeck(chaosTags.length));
  const board = useRef<HTMLDivElement>(null),
    moodTween = useRef<gsap.core.Timeline | null>(null),
    burst = useRef<HTMLDivElement>(null),
    burstTween = useRef<gsap.core.Tween | null>(null);
  const skipTagMotion = useRef(true);
  useEffect(
    () => () => {
      moodTween.current?.kill();
      burstTween.current?.kill();
    },
    [],
  );
  useEffect(() => {
    setTags(pickTags(tagDeck.current));
  }, []);
  useEffect(() => {
    const deal = () => {
      setStickerMoods(dealMoodStickers(stickerMoodDeck.current, 0));
      setStickerArt(drawRound(stickerArtDeck.current, 4));
    };
    // Let the section settle first, then introduce one mood bubble on its own.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        deal();
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    if (board.current) observer.observe(board.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!motion) {
      moodTween.current?.kill();
      burstTween.current?.kill();
      if (board.current)
        gsap.set(board.current, { clearProps: 'transform,opacity' });
    }
  }, [motion]);
  const choose = (next: number) => {
    setMood(next);
    setStickerMoods(dealMoodStickers(stickerMoodDeck.current, next));
    setStickerArt(drawRound(stickerArtDeck.current, 4));
    setDrawId(v => v + 1);
  };
  useEffect(() => {
    if (!drawId || !board.current) return;
    if (!motion) {
      soundCue('reveal');
      return;
    }
    const ctx = gsap.context(() => {
      moodTween.current = gsap.timeline({ onComplete: () => soundCue('reveal') })
        .fromTo('.mood-toy', { y: 38, scale: .75, opacity: 0 }, { y: 0, scale: 1, opacity: 1, stagger: .065, duration: .65, ease: 'back.out(2)' })
        .fromTo('.mood-dialogue', { y: 12, scale: .92, opacity: 0 }, { y: 0, scale: 1, opacity: 1, stagger: .18, duration: .35, ease: 'back.out(1.6)' }, .3);
    }, board);
    return () => ctx.revert();
  }, [drawId, motion]);
  const goNonsense = () => {
    setChaos((v) => !v);
    setFortune(fortunes[fortuneDeck.current()]);
    setTags(pickTags(tagDeck.current));
  };
  useEffect(() => {
    if (skipTagMotion.current) {
      skipTagMotion.current = false;
      return;
    }
    if (!motion || !burst.current) return;
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
  }, [tags, motion]);
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
            <span className="tiny-label">TODAY’S MOOD / 24 款随机收容</span>
            <div className="mood-console" aria-live="polite">
              <span>正在收容 NO. {String(mood + 1).padStart(2, '0')}</span>
              <strong>{moods[mood].label}</strong>
              <p>{moods[mood].tag}</p>
              <i>抽一次，换一个小场景</i>
            </div>
            <button
              className="random-mood"
              onClick={() => {
                let next = moodDeck.current();
                while (next === mood) next = moodDeck.current();
                choose(next);
              }}
            >
              <Shuffle size={18} /> 拆一个情绪盲盒 · 24 款
            </button>
          </div>
          <div className="mood-display reveal" ref={board}>
            <div className="mood-issue"><span>情绪收容所 / MOOD CLUB</span><span>NO. {String(mood + 1).padStart(2, '0')} / 24</span></div>
            <div className="mood-toy-stage">
              <span className="mood-stage-word" aria-hidden="true">MOOD!</span>
              {stickerMoods.map((moodIndex, i) => {
                const item = moods[moodIndex];
                return (
                <div className={'mood-toy toy-' + i} key={`${moodIndex}-${i}`}>
                  <Sticker
                    className="mood-collectible"
                    src={moodStickerCovers[stickerArt[i]]}
                    label={`打开情绪盲盒：${item.label}`}
                    lines={[item.reply]}
                    onReveal={() => choose(moodIndex)}
                  />
                  {moodScenes[mood][i] && (
                    <span className={'mood-dialogue dialogue-' + i}>
                      <strong>{moodScenes[mood][i][0]}</strong>{moodScenes[mood][i][1]}
                    </span>
                  )}
                </div>
              )})}
              <span className="mood-stage-note">自动冒泡中；也可以戳开任意一只 ↗</span>
            </div>
          </div>
        </div>
      </section>
      <FestivalGallery motion={motion} />
      <Playground motion={motion} />
      <section className={'nonsense section ' + (chaos ? 'nonsense-on' : '')}>
        <div className="section-kicker reveal">
          <span>PLEASE DO NOT PRESS THIS BUTTON.</span>
          <span>友情提示：本按钮没有正经用途。</span>
        </div>
        <div className="nonsense-content">
          <Image
            className="nonsense-mascot"
            src="/media/pupu-sticker.webp"
            width={170}
            height={190}
            alt=""
          />
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
          {tags.map((s, i) => (
            <span key={s + i}>{s}</span>
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
          <Image
            className="archive-mascot"
            src="/media/keychain-sticker.webp"
            width={180}
            height={200}
            alt=""
          />
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
            <span>12 份不同脑洞 · 点开看完整设计稿 ↗</span>
          </p>
        </div>
        <div className="archive-grid">
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
            <div className="art-stage">
              <Image
                unoptimized
                className="art-full"
                src={'/media/archive-' + chosen[0] + '.webp'}
                alt={chosen[1]}
                width={1400}
                height={1400}
              />
              <button
                className="art-download art-download-overlay"
                onClick={() =>
                  void downloadAsPng(
                    '/media/archive-' + chosen[0] + '.webp',
                    `墩墩和噗噗原稿-${chosen[1]}`,
                  ).catch(() => {})
                }
                aria-label={`下载 PNG：${chosen[1]}`}
              >
                <Download size={17} />
                下载原稿 PNG
              </button>
            </div>
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
