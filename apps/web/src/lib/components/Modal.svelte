<script lang="ts" module>
	export type ModalSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { focusTrap } from '$lib/actions';
	import { prefersReducedMotion } from '$lib/utils/motion';
	import { cn } from '$lib/utils/cn';

	interface Props {
		open: boolean;
		title?: string;
		size?: ModalSize;
		/** Close when the backdrop is clicked. Default true. */
		closeOnBackdrop?: boolean;
		/** Accessibility label (used as aria-label on the dialog). */
		label: string;
		onClose: () => void;
		children: Snippet;
	}

	let {
		open,
		title,
		size = 'md',
		closeOnBackdrop = true,
		label,
		onClose,
		children,
	}: Props = $props();

	const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

	// Lock body scroll while open.
	let prevOverflow = '';
	$effect(() => {
		if (open && typeof document !== 'undefined') {
			prevOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = prevOverflow;
			};
		}
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			onClose();
		}
	}

	function onBackdropClick(e: MouseEvent) {
		if (closeOnBackdrop && e.target === e.currentTarget) onClose();
	}

	// Reduced-motion => 0-duration transitions (kept structurally for svelte-check).
	const d = prefersReducedMotion() ? 0 : 200;
</script>

{#if open}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
			aria-label="Cerrar"
			tabindex="-1"
			onclick={onClose}
			transition:fade={{ duration: d ? 180 : 0 }}
		></button>

		<!-- Panel -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title ?? label}
			tabindex="-1"
			class={cn(
				'relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl focus:outline-none sm:p-6',
				sizeClass[size],
			)}
			use:focusTrap
			onkeydown={onKeydown}
			onclick={onBackdropClick}
			transition:scale={{ duration: d, start: 0.95 }}
		>
			{#if title}
				<h2 class="mb-4 text-xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">
					{title}
				</h2>
			{/if}
			{@render children()}
		</div>
	</div>
{/if}
