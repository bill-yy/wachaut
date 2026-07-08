/**
 * Dev-only logging helpers. No-ops in production builds.
 * Usage: devlog('[sfu] message'), devwarn('...'), deverror('...')
 */

export function devlog(...args: unknown[]): void {
	if (import.meta.env.DEV) console.log(...args);
}

export function devwarn(...args: unknown[]): void {
	if (import.meta.env.DEV) console.warn(...args);
}

/** Error logging that's always on — for genuine failures users need to know about. */
export function logError(...args: unknown[]): void {
	console.error(...args);
}
