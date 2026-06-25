/**
 * Web Audio API notification sounds for Wachaut.
 * No external files needed — all tones are generated procedurally.
 */

let audioCtx = null;
const NOTIFICATIONS_STORAGE_KEY = 'wachaut.notifications.muted';
const NOTIFICATIONS_VOLUME_KEY = 'wachaut.notifications.volume';

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return null; }
  }
  return audioCtx;
}

function isMuted() {
  try {
    return localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getVolume() {
  try {
    const v = localStorage.getItem(NOTIFICATIONS_VOLUME_KEY);
    return v !== null ? parseFloat(v) : 0.3;
  } catch {
    return 0.3;
  }
}

function setMuted(muted) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(muted));
  } catch { /* ignore */ }
}

/**
 * Play a two-tone beep.
 * @param {number} freq1 - First frequency (Hz)
 * @param {number} freq2 - Second frequency (Hz)
 * @param {number} duration - Duration of each tone (seconds)
 */
function playTonePair(freq1, freq2, duration = 0.08) {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const vol = getVolume();
  const now = ctx.currentTime;

  // Tone 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.frequency.value = freq1;
  osc1.type = 'sine';
  gain1.gain.setValueAtTime(vol * 0.5, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + duration);

  // Tone 2
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.frequency.value = freq2;
  osc2.type = 'sine';
  gain2.gain.setValueAtTime(vol * 0.5, now + duration);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 2);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + duration);
  osc2.stop(now + duration * 2);
}

/**
 * Viewer join — short ascending two-tone beep (high pitch)
 */
export function playViewerJoin() {
  playTonePair(880, 1100, 0.07);
}

/**
 * Viewer leave — short descending two-tone beep (lower pitch)
 */
export function playViewerLeave() {
  playTonePair(660, 440, 0.07);
}

/**
 * Host muted — single low tone
 */
export function playHostMuted() {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const vol = getVolume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 330;
  osc.type = 'sine';
  gain.gain.setValueAtTime(vol * 0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

/**
 * New chat message — very subtle soft click/tap
 */
export function playChatMessage() {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const vol = getVolume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 1200;
  osc.type = 'sine';
  gain.gain.setValueAtTime(vol * 0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

export { isMuted, setMuted, getVolume };
