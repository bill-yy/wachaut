<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** Show the "wachaut" wordmark next to the mark. */
		withWordmark?: boolean;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { withWordmark = true, size = 'md', class: klass = '' }: Props = $props();

	const markSize = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-12 w-12' };
	const wordSize = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };

	// Unique gradient id per instance (avoid duplicate ids when Brand renders multiple times).
	const gid = `brand-mark-g-${Math.random().toString(36).slice(2, 9)}`;
</script>

<span class={cn('inline-flex items-center gap-2.5 select-none', klass)}>
	<span
		class={cn('relative inline-flex items-center justify-center rounded-xl glow-brand', markSize[size])}
		style="background: linear-gradient(135deg, var(--color-amber-500), var(--color-amber-700));"
		aria-hidden="true"
	>
		<svg viewBox="0 0 48 48" class="h-3/5 w-3/5" fill="none">
			<defs>
				<linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stop-color="#fffbeb" />
					<stop offset="1" stop-color="#fef3c7" />
				</linearGradient>
			</defs>
			<rect x="8" y="11" width="32" height="20" rx="4.5" stroke={`url(#${gid})`} stroke-width="3" />
			<path d="M19 37 L29 37" stroke={`url(#${gid})`} stroke-width="3" stroke-linecap="round" />
			<path d="M24 31 L24 37" stroke={`url(#${gid})`} stroke-width="3" stroke-linecap="round" />
			<circle cx="24" cy="21" r="4" fill={`url(#${gid})`} />
			<path d="M17 21 a7 7 0 0 1 14 0" stroke={`url(#${gid})`} stroke-width="2.4" stroke-linecap="round" opacity="0.7" />
		</svg>
	</span>
	{#if withWordmark}
		<span
			class={cn('font-bold tracking-tight text-[var(--text)]', wordSize[size])}
			style="font-family: var(--font-display);"
		>wachaut</span>
	{/if}
</span>
