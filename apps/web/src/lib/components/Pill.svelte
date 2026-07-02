<script lang="ts" module>
	export type PillTone = 'success' | 'warning' | 'danger' | 'brand' | 'neutral';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		tone?: PillTone;
		/** Pulse the dot (live indicators). */
		pulse?: boolean;
		dot?: boolean;
		class?: string;
		children: Snippet;
	}

	let { tone = 'neutral', pulse = false, dot = true, class: klass = '', children }: Props = $props();

	const toneColor: Record<PillTone, string> = {
		success: 'bg-[var(--success)]',
		warning: 'bg-[var(--warning)]',
		danger: 'bg-[var(--danger)]',
		brand: 'bg-[var(--brand)]',
		neutral: 'bg-[var(--text-subtle)]',
	};

	const toneText: Record<PillTone, string> = {
		success: 'text-[var(--success)]',
		warning: 'text-[var(--warning)]',
		danger: 'text-[var(--danger)]',
		brand: 'text-[var(--brand)]',
		neutral: 'text-[var(--text-muted)]',
	};
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-full border border-current/15 bg-current/8 px-2.5 py-1 text-xs font-semibold',
		toneText[tone],
		klass,
	)}
>
	{#if dot}
		<span class="relative flex h-1.5 w-1.5">
			{#if pulse}
				<span class={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', toneColor[tone])}></span>
			{/if}
			<span class={cn('relative inline-flex h-1.5 w-1.5 rounded-full', toneColor[tone])}></span>
		</span>
	{/if}
	{@render children()}
</span>
