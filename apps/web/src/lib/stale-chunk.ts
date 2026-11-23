/**
 * Recovery for a tab that outlived a deploy.
 *
 * A deploy replaces every hashed chunk, so a tab opened before it can no
 * longer lazy-load a route or the mediasoup bundle: Vite fires
 * `vite:preloadError` right before the navigation fails ("Failed to fetch
 * dynamically imported module" — prod error panel, 2026-11). A reload picks
 * up the new build.
 *
 * At most once per window: a deploy that is really broken must show its
 * error, not reload in a loop.
 */

const RELOADED_AT_KEY = 'wachaut.stale-chunk-reloaded-at';
const RELOAD_WINDOW_MS = 30_000;

type ReloadMemory = Pick<Storage, 'getItem' | 'setItem'>;

/** True when the page should reload for a chunk that failed to load. */
export function shouldReloadForStaleChunk(
  storage: ReloadMemory | null,
  now: number = Date.now(),
): boolean {
  let reloadedAt = 0;
  try {
    reloadedAt = Number(storage?.getItem(RELOADED_AT_KEY)) || 0;
  } catch {
    // Storage blocked: nothing is recorded, so nothing holds the reload back.
  }
  if (now - reloadedAt < RELOAD_WINDOW_MS) return false;
  try {
    storage?.setItem(RELOADED_AT_KEY, String(now));
  } catch {
    // Private mode: this reload goes through, a repeat cannot be held back.
  }
  return true;
}
