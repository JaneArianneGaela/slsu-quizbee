"use client";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let musicTimer: ReturnType<typeof setInterval> | null = null;

export const isSoundOn = () => enabled;
export function setSound(v: boolean) {
  enabled = v;
  try { localStorage.setItem("sound", v ? "1" : "0"); } catch {}
  if (!v) stopMusic();
}
export function loadSoundPref() {
  try { enabled = localStorage.getItem("sound") !== "0"; } catch {}
}

/** Call from any click/tap. Browsers block audio until a user gesture. */
export function unlock() { ac(); }

function ac() {
  if (!enabled || typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(f: number, d = 0.15, type: OscillatorType = "sine", v = 0.18, at = 0, f2?: number) {
  const c = ac(); if (!c || !master) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
}

function noise(d = 0.5, v = 0.12, at = 0, f0 = 400, f1 = 6000) {
  const c = ac(); if (!c || !master) return;
  const t = c.currentTime + at, n = Math.floor(c.sampleRate * d);
  const buf = c.createBuffer(1, n, c.sampleRate), a = buf.getChannelData(0);
  for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = buf; fl.type = "bandpass"; fl.Q.value = 0.8;
  fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + d * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t);
}

function kick(f0 = 140, f1 = 35, d = 0.5, v = 0.5, at = 0) {
  const c = ac(); if (!c || !master) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
}

const saw = (f: number, d: number, v: number, at = 0) =>
  [-9, 0, 9].forEach((c) => tone(f * Math.pow(2, c / 1200), d, "sawtooth", v / 3, at));
const riser = (d = 1.2, v = 0.2, at = 0) => { noise(d, v, at, 200, 9000); tone(200, d, "sawtooth", v * 0.35, at, 1600); };

export const sfx = {
  click:   () => { tone(1400, 0.05, "square", 0.1, 0, 500); kick(300, 80, 0.08, 0.2); },
  select:  () => { kick(220, 90, 0.12, 0.3); tone(700, 0.1, "triangle", 0.2); tone(1050, 0.14, "triangle", 0.18, 0.06); },
  start:   () => { riser(0.8, 0.18); kick(70, 25, 0.5, 0.7, 0.75); tone(784, 0.3, "triangle", 0.18, 0.75); },
  tick:    () => { tone(1800, 0.03, "square", 0.07); kick(160, 60, 0.1, 0.25); },
  beep:    () => { tone(990, 0.18, "square", 0.14); tone(1320, 0.18, "sawtooth", 0.05); kick(100, 40, 0.2, 0.35); },
  buzz:    () => { saw(110, 0.9, 0.5); tone(82, 0.9, "square", 0.2, 0, 60); noise(0.6, 0.2, 0, 100, 3000); kick(90, 30, 0.7, 0.7); },
  lock:    () => { kick(90, 30, 0.45, 0.7); noise(0.12, 0.2, 0, 1500, 8000); tone(900, 0.3, "triangle", 0.2, 0.1); },
  whoosh:  () => { riser(0.9, 0.2); kick(70, 25, 0.6, 0.5, 0.8); },
  spinTick:() => { tone(1300, 0.04, "square", 0.14, 0, 700); noise(0.05, 0.08, 0, 2500, 6000); },
  correct: () => {
    kick(80, 28, 0.7, 0.8);
    [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, 0.9, "triangle", 0.2, i * 0.07); saw(f, 0.7, 0.08, i * 0.07); });
    noise(0.8, 0.15, 0.05, 3000, 10000);
  },
  win:     () => { kick(70, 25, 0.8, 0.9); [523, 659, 784, 1047].forEach((f) => saw(f, 1.2, 0.14, 0.02)); noise(1.2, 0.2, 0.05, 2000, 11000); },
  fanfare: () => {
    [[523,0,.18],[523,.2,.18],[523,.4,.18],[659,.6,.4],[784,1.05,.3],[659,1.4,.25],[784,1.7,.3]]
      .forEach(([f,t,d]) => { saw(f, d+.2, .24, t); saw(f/2, d+.2, .14, t); kick(110, 45, .25, .5, t); });
    kick(70, 22, 1.2, 1, 2.1); noise(2.6, .3, 2.1, 1500, 12000);
    [523,659,784,1047,1319].forEach((f) => saw(f, 1.9, .2, 2.1));
  },
};

export function startMusic() {
  if (musicTimer) return;
  const ch = [[261.6,329.6,392,523.3],[220,277.2,329.6,440],[174.6,220,261.6,349.2],[196,246.9,293.7,392]];
  let i = 0;
  musicTimer = setInterval(() => {
    if (!ac()) return;
    const c = ch[Math.floor(i / 8) % 4];
    tone(c[i % 4] * (i % 8 > 3 ? 1 : 0.5), 0.5, "triangle", 0.05);
    if (i % 8 === 0) tone(c[0] / 2, 1.4, "sine", 0.07);
    i++;
  }, 230);
}
export function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; }
export const musicOn = () => !!musicTimer;