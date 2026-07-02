<script lang="ts" module>
	export type IconButtonVariant = 'ghost' | 'solid' | 'glass';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	interface Props extends HTMLButtonAttributes {
		/** Required for a11y: icon-only buttons must name themselves. */
		label: string;
		variant?: IconButtonVariant;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children: Snippet;
	}

	let {
		label,
		variant = 'ghost',
		size = 'md',
		class: klass = '',
		children,
		...rest
	}: Props = $props();

	const variantClass: Record<IconButtonVariant, string> = {
		ghost: 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
		solid: 'bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]',
		glass: 'glass text-[var(--text)] hover:bg-[var(--surface)]',
	};

	const sizeClass = {
		sm: 'h-9 w-9',
		md: 'h-11 w-11',
		lg: 'h-12 w-12',
	};
</script>

<button
	class={cn(
		'inline-flex shrink-0 items-center justify-center rounded-xl transition-all active:scale-95',
		variantClass[variant],
		sizeClass[size],
		klass,
	)}
	aria-label={label}
	title={label}
	{...rest}
>
	{@render children()}
</button>
