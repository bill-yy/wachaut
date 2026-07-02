/**
 * Shared formatting helpers for host & viewer.
 */

/** Format seconds as M:SS (recording duration). */
export function formatDuration(totalSeconds: number): string {
	const m = Math.floor(totalSeconds / 60);
	const sec = totalSeconds % 60;
	return `${m}:${sec.toString().padStart(2, '0')}`;
}
