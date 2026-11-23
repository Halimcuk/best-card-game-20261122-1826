// sound.js — tiny WebAudio chimes, generated in code. No audio files, no network.
// The context is created on the first user gesture; every call before that is a no-op.
let audioContext = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function context() {
  if (muted) return null;
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

function tone(freq, startIn, length, type = 'sine', gain = 0.12) {
  const ctx = context();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + startIn;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(gain, t + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.001, t + length);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

export function playClickSound() {
  tone(660, 0, 0.08, 'triangle', 0.08);
}

export function playDealSound() {
  tone(520, 0, 0.09, 'triangle', 0.09);
  tone(780, 0.07, 0.09, 'triangle', 0.09);
}

export function playWinRoundSound() {
  tone(523, 0, 0.12, 'sine', 0.12);
  tone(659, 0.1, 0.12, 'sine', 0.12);
  tone(784, 0.2, 0.2, 'sine', 0.12);
}

export function playLoseRoundSound() {
  tone(392, 0, 0.14, 'sawtooth', 0.05);
  tone(311, 0.12, 0.2, 'sawtooth', 0.05);
}

export function playVictorySound() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.28, 'sine', 0.13));
}

export function playDefeatSound() {
  [392, 349, 311, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, 'triangle', 0.1));
}
