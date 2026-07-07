<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Monitor } from 'lucide-svelte';

	let status = $derived(page.status);
	let message = $derived(page.error?.message || '');

	const titles: Record<number, string> = {
		404: 'Página no encontrada',
		500: 'Algo salió mal',
	};
	const title = $derived(titles[status] ?? 'Error');
</script>

<svelte:head>
	<title>{title} — Wachaut</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-app px-6 text-center">
	<!-- Ambient glow -->
	<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<div
			class="absolute -top-40 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
			style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"
		></div>
	</div>

	<!-- Icon with glow -->
	<div class="relative mb-6">
		<div class="absolute inset-0 rounded-3xl opacity-40 blur-2xl gradient-brand"></div>
		<div class="relative flex h-20 w-20 animate-float items-center justify-center rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
			<Monitor class="h-10 w-10 text-[var(--brand)]" />
		</div>
	</div>

	<!-- Status code -->
	<p class="mb-2 font-mono text-5xl font-bold text-[var(--brand)]">{status}</p>

	<!-- Title -->
	<h1 class="mb-2 text-2xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">
		{title}
	</h1>

	<!-- Message -->
	<p class="mb-8 max-w-sm text-sm text-[var(--text-muted)]">
		{#if status === 404}
			La página que buscas no existe o la sala ha cerrado.
		{:else}
			{message || 'Ha ocurrido un error inesperado.'}
		{/if}
	</p>

	<!-- CTA -->
	<a href="/" class="btn-primary gap-2 px-6 py-3">
		Volver al inicio
	</a>
</div>
