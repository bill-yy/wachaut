<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		text: string;
		/** Preferred side; auto-flips if no space. */
		side?: 'top' | 'bottom' | 'left' | 'right';
		class?: string;
		children: Snippet;
	}

	let { text, side = 'top', class: klass = '', children }: Props = $props();

	const sideClass = {
		top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
		bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
		left: 'right-full top-1/2 -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 -translate-y-1/2 ml-2',
	};
</script>

<span class="relative inline-flex group/tt">
	{@render children()}
	<span
		role="tooltip"
		class={cn(
			'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
			sideClass[side],
			klass,
		)}
		style="background: var(--surface-2); color: var(--text); border: 1px solid var(--border);"
	>
		{text}
	</span>
</span>
