export type SoundKind = 'hover' | 'pop' | 'draw' | 'reveal' | 'squish' | 'paper' | 'answer' | 'success' | 'chaos' | 'navigate';
export function soundCue(kind: SoundKind) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('duo-sound', { detail: kind }));
}

/** Soft, original procedural foley; no downloads, autoplay loops or audio tracking. */
export function playSound(ctx: AudioContext, kind: SoundKind) {
  const score: Record<SoundKind, number[]> = {
    hover: [900], pop: [460, 690], draw: [240, 300, 380, 480],
    reveal: [660, 880, 1100], squish: [220, 145], paper: [320, 430, 520],
    answer: [620, 780], success: [523, 659, 784, 1047],
    chaos: [180, 540, 270, 810, 1080], navigate: [440, 660],
  };
  score[kind].forEach((frequency, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const at = ctx.currentTime + i * (kind === 'draw' ? .055 : .07);
    const duration = kind === 'hover' ? .045 : kind === 'squish' ? .21 : .13;
    osc.type = kind === 'paper' || kind === 'draw' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(frequency, at);
    osc.frequency.exponentialRampToValueAtTime(frequency * (kind === 'squish' ? .42 : 1.22), at + duration);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(kind === 'hover' ? .009 : .027, at + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(at); osc.stop(at + duration + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  });
}
