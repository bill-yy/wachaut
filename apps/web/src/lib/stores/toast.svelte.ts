/**
 * Toast queue (Svelte 5 runes, module-level $state).
 *
 * Rendered globally by <Toaster />. Components call `toast.push(...)`
 * instead of managing their own ephemeral banners.
 */

export type ToastKind = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
	id: number;
	kind: ToastKind;
	message: string;
	/** Auto-dismiss after ms. 0 = sticky. */
	duration: number;
}

class ToastStore {
	items = $state<Toast[]>([]);
	#seq = 0;

	push(message: string, kind: ToastKind = 'info', duration = 4000): number {
		const id = ++this.#seq;
		this.items = [...this.items, { id, kind, message, duration }];
		if (duration > 0) {
			setTimeout(() => this.dismiss(id), duration);
		}
		return id;
	}

	info(message: string, duration?: number) {
		return this.push(message, 'info', duration);
	}
	success(message: string, duration?: number) {
		return this.push(message, 'success', duration);
	}
	error(message: string, duration = 5000) {
		return this.push(message, 'error', duration);
	}
	warning(message: string, duration?: number) {
		return this.push(message, 'warning', duration);
	}

	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();
