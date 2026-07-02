<script lang="ts" module>
	export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		tone?: BadgeTone;
		class?: string;
		children: Snippet;
	}

	let { tone = 'neutral', class: klass = '', children }: Props = $props();

	const tones: Record<BadgeTone, string> = {
		neutral: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',
		brand: 'bg-[var(--brand)]/12 text-[var(--brand)] border-[var(--brand)]/30',
		success: 'bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30',
		warning: 'bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30',
		danger: 'bg-[var(--danger)]/12 text-[var(--danger)] border-[var(--danger)]/30',
	};
</script>

<span
	class={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[tone], klass)}
>
	{@render children()}
</span>
