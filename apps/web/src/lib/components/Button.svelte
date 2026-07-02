<script lang="ts" module>
	export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
	export type ButtonSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	interface Props extends HTMLButtonAttributes {
		variant?: ButtonVariant;
		size?: ButtonSize;
		loading?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled,
		class: klass = '',
		children,
		...rest
	}: Props = $props();

	const variantClass: Record<ButtonVariant, string> = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		ghost: 'btn-ghost',
		danger: 'btn-danger',
	};

	const sizeClass: Record<ButtonSize, string> = {
		sm: 'text-xs px-3.5 py-2 gap-1.5',
		md: 'text-sm px-5 py-2.5 gap-2',
		lg: 'text-base px-7 py-3.5 gap-2.5',
	};
</script>

<button
	class={cn('inline-flex items-center justify-center font-semibold transition-all', variantClass[variant], sizeClass[size], klass)}
	disabled={disabled ?? loading}
	{...rest}
>
	{#if loading}
		<span
			class="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
			aria-hidden="true"
		></span>
	{/if}
	{@render children()}
</button>
