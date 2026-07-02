/**
 * Minimal class name joiner (no external deps).
 *
 * Accepts the values Svelte passes as the `class` attribute and flattens them
 * into a single space-separated string, dropping falsy/empty parts.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...parts: ClassValue[]): string {
	let out = '';
	for (const p of parts) {
		if (!p) continue;
		out += (out ? ' ' : '') + p;
	}
	return out;
}
