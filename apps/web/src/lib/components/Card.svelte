<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** Adds hover lift + shadow. */
		interactive?: boolean;
		/** Glassy translucent surface instead of solid. */
		glass?: boolean;
		class?: string;
		style?: string;
		children: Snippet;
	}

	let {
		interactive = false,
		glass = false,
		class: klass = '',
		style = '',
		children,
	}: Props = $props();
</script>

<div
	class={cn(
		'rounded-2xl p-6 transition-all',
		glass ? 'glass' : 'border border-[var(--border)] bg-[var(--surface)]',
		interactive && 'hover:-translate-y-1 hover:border-[var(--brand)]/40 hover:shadow-glow',
		klass,
	)}
	{style}
>
	{@render children()}
</div>
