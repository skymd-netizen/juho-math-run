// 외부 파일 없이 WebAudio로 만드는 간단한 효과음
let ctx = null;
let muted = false;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', vol = 0.2, slideTo = null) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  unlock() { ensure(); },
  correct() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.22)); },
  wrong() { tone(220, 0, 0.35, 'sawtooth', 0.2, 80); tone(160, 0.05, 0.3, 'square', 0.12, 60); },
  coin() { tone(988, 0, 0.08, 'square', 0.1); tone(1319, 0.07, 0.14, 'square', 0.1); },
  jump() { tone(300, 0, 0.18, 'sine', 0.15, 700); },
  lane() { tone(500, 0, 0.05, 'sine', 0.05, 420); },
  bonus() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.2, 'square', 0.12)); },
  special() { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.3, 'triangle', 0.2)); },
  hurdle() { tone(150, 0, 0.15, 'square', 0.15, 90); },
  win() { [523, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.3, 'triangle', 0.22)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.35, 'triangle', 0.2)); },
  heal() { [659, 880, 1319].forEach((f, i) => tone(f, i * 0.09, 0.22, 'sine', 0.2)); },
  promote() { [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.11, 0.4, 'triangle', 0.22)); [262, 330, 392].forEach((f) => tone(f, 0.8, 0.9, 'sine', 0.12)); },
  firework() { tone(1400 + Math.random() * 600, 0, 0.25, 'square', 0.05, 300); },
  toggleMute() { muted = !muted; return muted; },
  get muted() { return muted; },
};
