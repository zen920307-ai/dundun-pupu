'use client';
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** One scoped choreography; decorative loops only run while their section is visible. */
export default function ExperienceMotion({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.from('.hero-copy > *', { y: 36, opacity: 0, stagger: .12, duration: 1, ease: 'power3.out' });
        gsap.to('.reading-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: .2 } });
        gsap.utils.toArray<HTMLElement>('.section-kicker').forEach(el => {
          gsap.from(el, { '--rule-progress': 0, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 88%' } });
        });
        gsap.utils.toArray<HTMLElement>('.manifesto-peeker,.creator-mascot,.nonsense-mascot,.archive-mascot').forEach((el, i) => {
          gsap.fromTo(el, { y: 22, rotation: -5 }, { y: -18, rotation: 5, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.4 } });
          el.style.transformOrigin = i % 2 ? 'bottom right' : 'bottom center';
        });
        gsap.utils.toArray<HTMLElement>('.bio,.portal,.mission-machine,.buddy-test').forEach(el => {
          gsap.from(el, { clipPath: 'inset(8% 0 0 0 round 24px)', duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
        });
        gsap.utils.toArray<HTMLElement>('.mood-collectible').forEach((el, i) => {
          const float = gsap.to(el, { y: i % 2 ? -7 : 7, rotation: i % 2 ? 2 : -2, duration: 2.1 + i * .3, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
          ScrollTrigger.create({ trigger: '.mood-toy-stage', start: 'top bottom', end: 'bottom top', onToggle: self => { if (self.isActive) float.play(); else float.pause(); } });
        });
      });
      const interactive = '.pill,.travel-cta,.random-mood,.mission-button,.chaos-button,.back-top';
      let hovered: HTMLElement | null = null;
      const reset = () => { if (hovered) gsap.to(hovered, { x: 0, y: 0, duration: .55, ease: 'elastic.out(1,.5)', overwrite: true }); hovered = null; };
      const move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const el = (e.target as Element).closest<HTMLElement>(interactive);
        if (hovered && hovered !== el) reset();
        if (!el) return;
        hovered = el;
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: ((e.clientX - r.left) / r.width - .5) * 10, y: ((e.clientY - r.top) / r.height - .5) * 8, duration: .3, overwrite: true });
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerleave', reset);
      window.addEventListener('blur', reset);
      return () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerleave', reset);
        window.removeEventListener('blur', reset);
        if (hovered) { gsap.killTweensOf(hovered); gsap.set(hovered, { x: 0, y: 0 }); }
        ctx.revert();
      };
    });
    return () => media.revert();
  }, [enabled]);
  return <div className="reading-progress" aria-hidden="true" />;
}
