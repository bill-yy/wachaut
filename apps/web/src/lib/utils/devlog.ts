/**
 * Dev-only logging helpers. No-ops in production builds.
 * Usage: devlog('[sfu] message'), devwarn('...'), logError('...')
 */

import { captureClientError } from '../error-report';

export function devlog(...args: unknown[]): void {
	if (import.meta.env.DEV) console.log(...args);
}

export function devwarn(...args: unknown[]): void {
	if (import.meta.env.DEV) console.warn(...args);
}

/**
 * Error logging that's always on — for genuine failures users need to know
 * about. Also reported to the server's error tracker (admin panel).
 */
export function logError(...args: unknown[]): void {
	console.error(...args);
	const first = args[0];
	if (first instanceof Error || typeof first === 'string') {
		captureClientError(first, { component: 'console' });
	}
}
