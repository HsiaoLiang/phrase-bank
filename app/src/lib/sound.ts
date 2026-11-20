/* Short synthesised sound effects (Web Audio, no audio files). */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    try {
      ctx = new C();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Note = [freq: number, at: number, dur: number, type?: OscillatorType, vol?: number];

function play(notes: Note[]) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + 0.01;
  for (const [f, at, dur, type = "triangle", vol = 0.14] of notes) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0 + at);
    g.gain.setValueAtTime(0.0001, t0 + at);
    g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
    o.connect(g).connect(c.destination);
    o.start(t0 + at);
    o.stop(t0 + at + dur + 0.02);
  }
}

export const sfx = {
  tap: () => play([[620, 0, 0.06, "sine", 0.05]]),
  correct: () =>
    play([
      [784, 0, 0.12],
      [1175, 0.08, 0.22],
    ]),
  wrong: () =>
    play([
      [233, 0, 0.16, "square", 0.05],
      [196, 0.12, 0.24, "square", 0.05],
    ]),
  combo: () =>
    play([
      [880, 0, 0.08],
      [1109, 0.06, 0.08],
      [1319, 0.12, 0.18],
    ]),
  complete: () =>
    play([
      [523, 0, 0.14],
      [659, 0.12, 0.14],
      [784, 0.24, 0.14],
      [1047, 0.36, 0.4],
    ]),
  chest: () =>
    play([
      [1319, 0, 0.1, "sine", 0.1],
      [1568, 0.07, 0.1, "sine", 0.1],
      [2093, 0.14, 0.3, "sine", 0.1],
    ]),
  heart: () =>
    play([
      [330, 0, 0.12, "sine", 0.1],
      [247, 0.1, 0.25, "sine", 0.1],
    ]),
  level: () =>
    play([
      [523, 0, 0.12],
      [659, 0.1, 0.12],
      [784, 0.2, 0.12],
      [1047, 0.3, 0.12],
      [1319, 0.42, 0.45],
    ]),
};
