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

// ── Play a wav file from the public/assets/sounds directory ─────────────────

function playFile(path: string) {
  try {
    new Audio(path).play().catch(() => {/* autoplay blocked */});
  } catch {
    /* Audio unavailable */
  }
}

// ── Public SFX catalogue ────────────────────────────────────────────────────

/** Card Forge – "lock it in" stamp sound (wav file). */
export function sfxForge() {
  playFile("/assets/sounds/lock-it-in.wav");
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
  osc("square", (o, g, c) => {
    const t = c.currentTime;
    o.frequency.setValueAtTime(523, t);
    o.frequency.setValueAtTime(659, t + 0.12);
    o.frequency.setValueAtTime(784, t + 0.24);
    o.frequency.setValueAtTime(1047, t + 0.36);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    o.start(t);
    o.stop(t + 0.6);
  });
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
