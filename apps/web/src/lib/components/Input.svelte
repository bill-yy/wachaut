<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	interface Props extends HTMLInputAttributes {
		label?: string;
		hint?: string;
		error?: string;
		/** Optional leading icon (snippet). */
		leading?: Snippet;
		children?: Snippet;
		/** Bindable value (two-way binding support). */
		value?: string | number | undefined;
		class?: string;
	}

	let {
		label,
		hint,
		error,
		leading,
		class: klass = '',
		id,
		value = $bindable(),
		children,
		...rest
	}: Props = $props();

	// Stable id for label association if none provided. Reactive to `id` prop.
	const generated = `in-${Math.random().toString(36).slice(2, 9)}`;
	const inputId = $derived(id ?? generated);
</script>

<div class="w-full">
	{#if label}
		<label for={inputId} class="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
			{label}
		</label>
	{/if}
	<div class="relative">
		{#if leading}
			<span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-subtle)]">
				{@render leading()}
			</span>
		{/if}
		<input
			id={inputId}
			bind:value
			class={cn('input-field', leading && 'pl-11', error && '!border-[var(--danger)] focus:!shadow-[0_0_0_4px_color-mix(in_srgb,var(--danger)_18%,transparent)]', klass)}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
			{...rest}
		/>
		{@render children?.()}
	</div>
	{#if error}
		<p id={`${inputId}-error`} class="mt-1.5 text-xs font-medium text-[var(--danger)]">{error}</p>
	{:else if hint}
		<p id={`${inputId}-hint`} class="mt-1.5 text-xs text-[var(--text-subtle)]">{hint}</p>
	{/if}
</div>
