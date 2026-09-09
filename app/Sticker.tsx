'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Image from './IPImage';
import { pokeLines, shuffledDeck } from './playful-content';

export default function Sticker({
  src,
  className,
  label,
  lines = pokeLines,
  autoReply,
  autoReplyKey,
  onReveal,
}: {
  src: string;
  className: string;
  label: string;
  lines?: readonly string[];
  /** A contextual line can be surfaced without requiring visitors to discover the sticker interaction. */
  autoReply?: string;
  autoReplyKey?: number;
  onReveal?: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const art = useRef<HTMLSpanElement>(null);
  const animation = useRef<gsap.core.Tween | null>(null);
  const [reply, setReply] = useState('');
  const deck = useRef(shuffledDeck(lines.length));
  const canMove = () =>
    button.current?.closest('main')?.dataset.motion !== 'false';
  useEffect(() => {
    if (!reply) return;
    const timer = setTimeout(() => setReply(''), 2600);
    return () => clearTimeout(timer);
  }, [reply]);
  useEffect(() => {
    if (!autoReply || autoReplyKey === undefined) return;
    const timer = setTimeout(() => setReply(autoReply), 420);
    return () => clearTimeout(timer);
  }, [autoReply, autoReplyKey]);
  useEffect(
    () => () => {
      animation.current?.kill();
    },
    [],
  );
  const reset = () => {
    animation.current?.kill();
    if (art.current)
      animation.current = gsap.to(art.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: canMove() ? 0.45 : 0,
        ease: 'elastic.out(1,.5)',
      });
  };
  return (
    <button
      ref={button}
      type="button"
      className={`sticker-widget ${className}`}
      aria-label={label}
      onClick={() => {
        setReply(lines[deck.current()]);
        onReveal?.();
        if (art.current && canMove()) {
          animation.current?.kill();
          animation.current = gsap.fromTo(
            art.current,
            { scale: 0.9, rotation: -8 },
            { scale: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1,.4)' },
          );
        }
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse' || !canMove() || !art.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        animation.current?.kill();
        animation.current = gsap.to(art.current, {
          x: x * 9,
          y: y * 7,
          rotation: x * 9,
          duration: 0.2,
          overwrite: true,
        });
      }}
      onPointerLeave={reset}
      onBlur={reset}
    >
      <span className="sticker-art" ref={art}>
        <Image src={src} width={320} height={340} alt="" loading="lazy" />
      </span>
      <output
        className={'sticker-whisper ' + (reply ? 'speaking' : '')}
      >
        {reply}
      </output>
    </button>
  );
}
