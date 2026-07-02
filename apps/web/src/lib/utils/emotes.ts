/**
 * Shared emoji/reaction data for host & viewer.
 */

export interface EmoteCategory {
	label: string;
	emojis: string[];
}

export const EMOTE_CATEGORIES: EmoteCategory[] = [
	{ label: 'Reacciones', emojis: ['👍', '👎', '❤️', '🔥', '👏', '😂', '🎉', '😮', '😢', '😡'] },
	{ label: 'Gestos', emojis: ['👋', '✌️', '💪', '🙏'] },
	{ label: 'Objetos', emojis: ['⭐', '💯', '🎯', '💡', '🎵'] },
	{ label: 'Comida', emojis: ['☕', '🍕', '🎂'] },
];

export const ALL_EMOTES: string[] = EMOTE_CATEGORIES.flatMap((c) => c.emojis);

const DEFAULT_FAVORITES = ['👍', '❤️', '🔥', '👏', '😂'];

/** Load the user's favorite emojis from localStorage (host or viewer key). */
export function loadFavorites(storageKey: string): string[] {
	try {
		const stored = JSON.parse(localStorage.getItem(storageKey) ?? '');
		if (Array.isArray(stored) && stored.length >= 5) return stored.slice(0, 5);
	} catch {
		/* ignore */
	}
	return [...DEFAULT_FAVORITES];
}

/** Persist favorites to localStorage. */
export function saveFavorites(storageKey: string, emojis: string[]): void {
	try {
		localStorage.setItem(storageKey, JSON.stringify(emojis.slice(0, 5)));
	} catch {
		/* ignore */
	}
}

/** Promote an emoji to the front of the favorites list (MRU), persisting. */
export function trackFavorite(storageKey: string, current: string[], emoji: string): string[] {
	const next = [...current];
	const idx = next.indexOf(emoji);
	if (idx !== -1) next.splice(idx, 1);
	next.unshift(emoji);
	const result = next.slice(0, 5);
	saveFavorites(storageKey, result);
	return result;
}
