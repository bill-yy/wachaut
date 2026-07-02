<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		label?: string;
		class?: string;
	}

	let { label, class: klass = '' }: Props = $props();
</script>

{#if label}
	<div class={cn('flex items-center gap-3', klass)} role="separator">
		<span class="h-px flex-1 bg-[var(--border)]"></span>
		<span class="text-xs font-medium uppercase tracking-wider text-[var(--text-subtle)]">{label}</span>
		<span class="h-px flex-1 bg-[var(--border)]"></span>
	</div>
{:else}
	<hr class={cn('border-0 border-t border-[var(--border)]', klass)} />
{/if}
