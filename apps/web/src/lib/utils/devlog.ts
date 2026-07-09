/**
 * Logging helpers.
 *
 * `devlog`/`devwarn` are gated behind import.meta.env.DEV so production builds
 * stay silent. To temporarily enable diagnostics in production, set
 * localStorage.debug = 'sfu' in the browser console and reload.
 *
 * `logError` is always on — for genuine failures users need to know about.
 */

const DEBUG_KEY = 'debug';
const isEnabled = (() => {
  try {
    return import.meta.env.DEV || localStorage.getItem(DEBUG_KEY) === 'sfu';
  } catch {
    return false;
  }
})();

export function devlog(...args: unknown[]): void {
  if (isEnabled) console.log(...args);
}

export function devwarn(...args: unknown[]): void {
  if (isEnabled) console.warn(...args);
}

/** Error logging that's always on — for genuine failures users need to know about. */
export function logError(...args: unknown[]): void {
  console.error(...args);
}
