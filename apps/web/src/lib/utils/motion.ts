/**
 * Motion helpers that respect the user's reduced-motion preference.
 */

/** True when the user has requested reduced motion. Reactive-safe to read at call time. */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns a duration (ms) for an animation, scaled down to ~0 when the user
 * prefers reduced motion. Lets components keep their easing/structure while
 * becoming effectively instant for those users.
 */
export function motionDuration(normal: number): number {
	return prefersReducedMotion() ? 1 : normal;
}
