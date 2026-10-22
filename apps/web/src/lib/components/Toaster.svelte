<script lang="ts">
	import { fly } from 'svelte/transition';
	import { t as translate } from '$lib/i18n/index.svelte';
	import { flip } from 'svelte/animate';
	import { toast, type ToastKind } from '$lib/stores/toast.svelte';
	import { prefersReducedMotion } from '$lib/utils/motion';
	import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-svelte';

	const reduce = prefersReducedMotion();
	const d = reduce ? 0 : 220;

	const icon: Record<ToastKind, typeof Info> = {
		info: Info,
		success: CheckCircle2,
		warning: AlertTriangle,
		error: AlertCircle,
	};

	const accent: Record<ToastKind, string> = {
		info: 'text-[var(--brand)]',
		success: 'text-[var(--success)]',
		warning: 'text-[var(--warning)]',
		error: 'text-[var(--danger)]',
	};
</script>

<!-- Live region: polite so announcements don't interrupt. -->
<div
	class="pointer-events-none fixed inset-x-0 top-4 z-[120] flex flex-col items-center gap-2 px-4"
	style="top: max(1rem, env(safe-area-inset-top));"
	aria-live="polite"
	aria-atomic="false"
>
	{#each toast.items as t (t.id)}
		{@const Icon = icon[t.kind]}
		<div
			class="glass pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl px-4 py-3 shadow-xl"
			animate:flip={{ duration: d }}
			in:fly={{ y: -16, duration: d }}
			out:fly={{ y: -16, duration: reduce ? 0 : 160 }}
			role={t.kind === 'error' ? 'alert' : 'status'}
		>
			<Icon class={`mt-0.5 h-5 w-5 shrink-0 ${accent[t.kind]}`} aria-hidden="true" />
			<p class="min-w-0 flex-1 break-words text-sm text-[var(--text)]">{t.message}</p>
			<button
				class="-m-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-subtle)] transition-colors hover:text-[var(--text)]"
				aria-label={translate('comp.closeToast')}
				onclick={() => toast.dismiss(t.id)}
			>
				<X class="h-4 w-4" aria-hidden="true" />
			</button>
		</div>
	{/each}
</div>
