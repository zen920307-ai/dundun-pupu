'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  extraQuestions,
  extraMissions,
  shuffledDeck,
  drawRound,
} from './playful-content';
import Image from './IPImage';
import { soundCue } from './sound';
import Sticker from './Sticker';
import { ArrowRight, RotateCcw, Shuffle } from 'lucide-react';
const questions = [
  ...extraQuestions,
  {
    q: '好朋友说「我没事」。你会？',
    answers: ['嘴上说行，悄悄坐到旁边。', '直接贴过去：我有事，想抱你。'],
  },
  {
    q: '周末计划突然取消。你会？',
    answers: ['太好了。沙发，我们来了。', '没关系！两个人发呆也是约会。'],
  },
  {
    q: '只剩最后一口好吃的。你会？',
    answers: ['「我不爱吃。」然后推给对方。', '分成两半。大的一半偷偷给你。'],
  },
  {
    q: '朋友突然发来一个「在吗」。你会？',
    answers: ['先把手机扣下，深呼吸。', '秒回：在！我一直都在！'],
  },
  {
    q: '你们一起迷路了。接下来？',
    answers: ['假装这是隐藏关卡。', '先拍照，再找路。'],
  },
  {
    q: '对方把你的零食吃掉了。你会？',
    answers: ['记在小本本上，明年再算。', '没事，再开一包一起吃。'],
  },
  {
    q: '你们的合照拍糊了。你会？',
    answers: ['这叫艺术，不叫失误。', '再拍一张，糊得更有默契。'],
  },
  {
    q: '今天谁负责做决定？',
    answers: ['我不决定，你也别决定。', '石头剪刀布，输的人请奶茶。'],
  },
];
const missions = [
  ...extraMissions,
  ['认真发呆三分钟', '不许想工作。想晚饭可以。'],
  ['给好朋友发一句废话', '比如：「我刚刚眨了一下眼。」'],
  ['把今天的小事夸大十倍', '喝到水了？恭喜征服一片海洋。'],
  ['给自己的拖延起个艺名', '比如：战略性缓冲。'],
  ['找个舒服姿势，暂停营业', '躺好。这不是摆烂，是恢复出厂设置。'],
  ['把最后一口留给自己', '今天，你也是需要被照顾的好朋友。'],
  ['邀请一个人一起看天', '不用说话。云会负责聊天。'],
  ['给身边的物件配句台词', '水杯：你能不能主动一点？'],
  ['把一件小事命名为大事件', '今天成功穿上袜子：伟大胜利。'],
  ['和好朋友同步叹气一次', '三、二、一。叹完继续活。'],
  ['给自己颁一个奖', '奖项：今日也没有放弃可爱。'],
  ['把聊天记录翻到最上面', '看看你们是从哪句废话开始的。'],
  ['认真选一个表情包', '要那种一看就知道是你的。'],
  ['让噗噗替你做决定', '闭眼指一个方向，走两步就算。'],
  ['让墩墩替你拒绝一次', '墩墩：不行。今天到此为止。'],
  ['把晚饭吃得像庆功宴', '哪怕只是一个煎蛋，也要鼓掌。'],
  ['对着空气说：辛苦了', '空气没有回答，但它听见了。'],
  ['给明天留一句废话', '明天的你会觉得今天很会安排。'],
];
export default function Playground({ motion }: { motion: boolean }) {
  const questionDeck = useRef(shuffledDeck(questions.length));
  const missionDeck = useRef(shuffledDeck(missions.length, 0));
  const [round, setRound] = useState([0, 1, 2]);
  const [answers, setAnswers] = useState<number[]>([]),
    [mission, setMission] = useState(0),
    [issued, setIssued] = useState(false);
  const ticket = useRef<HTMLDivElement>(null),
    animation = useRef<gsap.core.Tween | null>(null);
  useEffect(
    () => () => {
      animation.current?.kill();
    },
    [],
  );
  useEffect(() => {
    setRound(drawRound(questionDeck.current, 3));
  }, []);
  const finished = answers.length === round.length;
  const isPupu = answers.reduce((a, b) => a + b, 0) >= 2;
  useEffect(() => {
    if (finished) soundCue('success');
  }, [finished]);
  const draw = () => {
    setMission(missionDeck.current());
    setIssued(true);
    if (motion && ticket.current) {
      animation.current?.kill();
      animation.current = gsap.fromTo(
        ticket.current,
        { y: -35, rotation: -6, opacity: 0 },
        {
          y: 0,
          rotation: -1,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(1.9)',
        },
      );
    }
  };
  return (
    <section className="playground section" id="playground">
      <div className="section-kicker reveal">
        <span>04 / FRIENDSHIP RESEARCH INSTITUTE</span>
        <span>不严谨，但很认真地胡闹。</span>
      </div>
      <div className="playground-title reveal">
        <h2>
          友情这种东西，
          <br />
          我们略懂<span>一点点。</span>
        </h2>
        <span className="test-stamp">
          非官方
          <br />
          搭子鉴定处
        </span>
      </div>
      <Sticker
        className="playground-sticker"
        src="/media/pillow-sticker.webp"
        label="戳戳趴着的墩墩抱枕"
      />
      <div className="playground-body">
        <div className="buddy-test reveal">
          <div className="test-top">
            <span>你是哪一种好朋友？</span>
            <span>{Math.min(answers.length + 1, 3)} / 3</span>
          </div>
          <div className="test-progress" aria-hidden="true">
            {round.map((_, i) => (
              <span key={i} className={answers.length > i ? 'done' : ''} />
            ))}
          </div>
          {!finished ? (
            <div className="question-area" key={round[answers.length]} aria-live="polite">
              <h3>{questions[round[answers.length]].q}</h3>
              {questions[round[answers.length]].answers.map((a, i) => (
                <button
                  className="quiz-answer"
                  key={a}
                  onClick={() => setAnswers((v) => [...v, i])}
                >
                  <span>{i === 0 ? 'A' : 'B'}</span>
                  {a}
                  <ArrowRight size={20} />
                </button>
              ))}
              <p className="test-footnote">
                36 道题，每次聊 3 道。刷新换一批，胡闹没有标准答案。
              </p>
            </div>
          ) : (
            <div className="quiz-result" aria-live="polite">
              <Image
                unoptimized
                src={
                  '/media/' +
                  (isPupu ? 'pupu-sticker.webp' : 'dundun-sticker.webp')
                }
                width={500}
                height={550}
                alt={isPupu ? '噗噗' : '墩墩'}
              />
              <div>
                <span>鉴定结果出炉！</span>
                <h3>
                  {isPupu ? '噗噗型' : '墩墩型'}
                  <br />
                  {isPupu ? '直球贴贴搭子' : '嘴硬心软搭子'}
                </h3>
                <p>
                  {isPupu
                    ? '你的喜欢，根本藏不住。好巧，朋友也很喜欢。'
                    : '看起来满不在乎，其实把朋友的事都偷偷记住。'}
                </p>
                <button
                  className="quiz-retry"
                  onClick={() => {
                    setRound(drawRound(questionDeck.current, 3));
                    setAnswers([]);
                  }}
                >
                  <RotateCcw size={16} /> 我换个姿势再测一次
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mission-machine reveal">
          <div className="machine-top">
            <span>胡闹事务所</span>
            <span>24H 不务正业</span>
          </div>
          <div className="mission-ticket" ref={ticket}>
            <span className="ticket-meta">
              TODAY’S VERY UNIMPORTANT MISSION
            </span>
            <p className="ticket-overline">
              今日胡闹任务 #{String(mission + 1).padStart(2, '0')}
            </p>
            <h3>{missions[mission][0]}</h3>
            <p>{missions[mission][1]}</p>
            <span className="ticket-sign">墩墩已阅 / 噗噗批准</span>
          </div>
          <button className="mission-button" onClick={draw}>
            <Shuffle size={20} />
            {issued ? '这个太正经，再抽一个' : '给我一个不正经任务'}
          </button>
          <p className="machine-fineprint" aria-live="polite">
            {issued
              ? '任务已掉落。做不做都没关系，开心最重要。'
              : '40 个胡闹任务 · 抽完一轮再重复。'}
          </p>
        </div>
      </div>
    </section>
  );
}
