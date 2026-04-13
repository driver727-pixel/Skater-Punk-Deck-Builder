/**
 * Centralized sound-effects module using the Web Audio API.
 *
 * Every helper is fire-and-forget and silently swallows errors so that a
 * missing AudioContext (e.g. server-side rendering, or browsers that have not
 * yet received a user gesture) never breaks the app.
 */

// ── Shared AudioContext (lazy singleton) ────────────────────────────────────

let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

// ── Low-level oscillator helpers ────────────────────────────────────────────

function osc(
  type: OscillatorType,
  setup: (o: OscillatorNode, g: GainNode, c: AudioContext) => void,
) {
  try {
    const c = ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.connect(g);
    g.connect(c.destination);
    setup(o, g, c);
  } catch {
    /* Audio unavailable – silently ignore */
  }
}

/**
 * Schedules a single musical layer relative to the current AudioContext time.
 * Unlike `osc`, this helper handles delayed starts plus the standard fade-out
 * envelope so higher-level fanfares can stack several tones at once.
 */
function layeredTone(
  type: OscillatorType,
  startAt: number,
  duration: number,
  frequency: number,
  gain: number,
  endFrequency?: number,
) {
  osc(type, (o, g, c) => {
    const now = c.currentTime;
    const t = now + startAt;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.frequency.setValueAtTime(frequency, t);
    if (endFrequency && endFrequency !== frequency) {
      o.frequency.exponentialRampToValueAtTime(endFrequency, t + duration);
    }
    o.start(t);
    o.stop(t + duration);
  });
}

// ── Play a wav file from the public/assets/sounds directory ─────────────────

function playFile(path: string) {
  try {
    new Audio(path).play().catch(() => {/* autoplay blocked */});
  } catch {
    /* Audio unavailable */
  }
}

// ── Public SFX catalogue ────────────────────────────────────────────────────

/** Board Builder – "Lock It In" button stamp sound (wav file). */
export function sfxLockItIn() {
  playFile("/assets/sounds/lock-it-in.wav");
}

/** Card Forge – forge button success ping (wav file). */
export function sfxSuccessPing() {
  playFile("/assets/sounds/successping.wav");
}

/** Soft click / pop – card selection, tab switches, small UI interactions. */
export function sfxClick() {
  osc("sine", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(800, t + 0.06);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.start(t);
    o.stop(t + 0.08);
  });
}

/** Positive confirmation – save, add to deck, trade accepted, deck created. */
export function sfxSuccess() {
  osc("sine", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(660, t);
    o.frequency.setValueAtTime(880, t + 0.1);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.start(t);
    o.stop(t + 0.25);
  });
}

/** Negative / removal – card removed, trade declined, delete. */
export function sfxRemove() {
  osc("triangle", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(500, t);
    o.frequency.exponentialRampToValueAtTime(250, t + 0.15);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.start(t);
    o.stop(t + 0.2);
  });
}

/** Whoosh – navigate, send trade, page transition. */
export function sfxNavigate() {
  osc("sine", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.start(t);
    o.stop(t + 0.15);
  });
}

// ── Battle-specific SFX (moved from BattleArena.tsx) ────────────────────────

/** Battle ready – ascending blip. */
export function sfxBattleReady() {
  osc("sine", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(660, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.15);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    o.start(t);
    o.stop(t + 0.3);
  });
}

/** Battle clash – aggressive descending saw. */
export function sfxBattleClash() {
  osc("sawtooth", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.5);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    o.start(t);
    o.stop(t + 0.6);
  });
}

/** Battle win – ascending fanfare. */
export function sfxBattleWin() {
  layeredTone("square", 0, 0.18, 523, 0.12);
  layeredTone("square", 0.12, 0.18, 659, 0.11);
  layeredTone("square", 0.24, 0.2, 784, 0.11);
  layeredTone("triangle", 0, 0.58, 262, 0.08, 392);
  layeredTone("triangle", 0.36, 0.38, 1047, 0.12, 1319);
  layeredTone("sine", 0.44, 0.3, 1568, 0.05, 1760);
}

/** Battle lose – descending bummer tone. */
export function sfxBattleLose() {
  osc("triangle", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    o.start(t);
    o.stop(t + 0.5);
  });
}

/** Error / blocked action – short buzz. */
export function sfxError() {
  osc("sawtooth", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(150, t);
    o.frequency.setValueAtTime(130, t + 0.06);
    o.frequency.setValueAtTime(150, t + 0.12);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.start(t);
    o.stop(t + 0.18);
  });
}

/** Reward shower – bright pings for Ozzies, loot, and upgrades. */
export function sfxRewardShower() {
  layeredTone("triangle", 0, 0.18, 988, 0.09, 1175);
  layeredTone("sine", 0.1, 0.16, 1319, 0.07, 1568);
  layeredTone("triangle", 0.2, 0.2, 1760, 0.08, 2093);
  layeredTone("sine", 0.28, 0.12, 2637, 0.04);
}
