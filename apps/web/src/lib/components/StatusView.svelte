<script lang="ts">
	/**
	 * Public status page (prerendered shell + client polling).
	 * Signals maintenance + room count from /api/status (web+signaling) and
	 * SFU reachability from /ready. No history: honest live state only.
	 */
	import { onMount } from 'svelte';
	import { dict, type Locale } from '$lib/i18n/dict';
	import Brand from '$lib/components/Brand.svelte';
	import { Activity, Radio, Users, MonitorPlay, RefreshCw } from 'lucide-svelte';

	let { locale }: { locale: Locale } = $props();
	const L = $derived(dict[locale]);

	type ApiState = 'checking' | 'ok' | 'maintenance' | 'down';
	let api: ApiState = $state('checking');
	let sfu: ApiState = $state('checking');
	let rooms = $state<number | null>(null);
	let lastCheck = $state<Date | null>(null);
	let refreshing = $state(false);

	async function check() {
		refreshing = true;
		try {
			const res = await fetch('/api/status', { signal: AbortSignal.timeout(5000) });
			const data = res.ok ? await res.json() : null;
			if (!data) throw new Error('bad payload');
			api = data.maintenance ? 'maintenance' : 'ok';
			rooms = typeof data.rooms === 'number' ? data.rooms : null;
		} catch {
			api = 'down';
		}
		try {
			const res = await fetch('/api/ready', { signal: AbortSignal.timeout(5000) });
			sfu = res.ok ? 'ok' : 'maintenance';
		} catch {
			sfu = 'down';
		}
		lastCheck = new Date();
		refreshing = false;
	}

	onMount(() => {
		check();
		const id = setInterval(check, 30_000);
		return () => clearInterval(id);
	});

	const dotClass = (s: ApiState) =>
		s === 'ok'
			? 'bg-[var(--success)]'
			: s === 'maintenance'
				? 'bg-[var(--warning)]'
				: s === 'down'
					? 'bg-[var(--danger)]'
					: 'bg-[var(--text-subtle)]';

	const label = (s: ApiState) =>
		s === 'checking' ? L['status.checking'] :
		s === 'ok' ? L['status.ok'] :
		s === 'maintenance' ? L['status.maintenance'] :
		L['status.down'];
</script>

<svelte:head>
	<title>{L['status.title']}</title>
	<meta name="description" content={L['status.description']} />
	<meta name="robots" content="noindex" />
	<link rel="canonical" href="https://wachaut.com{locale === 'es' ? '/estado/' : '/en/status/'}" />
</svelte:head>

<div class="relative min-h-screen bg-app">
	<nav class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4" aria-label={locale === 'es' ? 'Principal' : 'Main'}>
		<a href={locale === 'es' ? '/' : '/en/'} aria-label="Wachaut"><Brand size="md" /></a>
		<a
			href={locale === 'es' ? '/' : '/en/'}
			class="flex min-h-[44px] items-center px-2 text-sm text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]"
		>
			{locale === 'es' ? '← Inicio' : '← Home'}
		</a>
	</nav>

	<div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
		<div class="absolute right-0 top-0 h-[420px] w-[420px] rounded-full opacity-20 blur-[120px]" style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"></div>
	</div>

	<main class="mx-auto max-w-3xl px-4 pb-16">
		<header class="mb-8 text-center">
			<span class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/12">
				<Activity class="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
			</span>
			<h1 class="text-3xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">{L['status.h1']}</h1>
			<p class="mt-2 text-sm text-[var(--text-muted)]">{L['status.subtitle']}</p>
		</header>

	<!-- aria-live: async status flips (checking → ok/down) must be announced -->
		<div class="space-y-3" role="status" aria-live="polite">
			<!-- Web/API -->
			<div class="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Radio class="h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
					</span>
					<div>
						<h2 class="text-sm font-bold text-[var(--text)]">{L['status.web']}</h2>
						<p class="text-xs text-[var(--text-subtle)]">{L['status.webDesc']}</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<span class="relative flex h-2.5 w-2.5" aria-hidden="true">
						{#if api === 'ok'}
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75"></span>
						{/if}
						<span class="relative inline-flex h-2.5 w-2.5 rounded-full {dotClass(api)}"></span>
					</span>
					<span class="text-sm font-semibold text-[var(--text)]">{label(api)}</span>
				</div>
			</div>

			<!-- SFU (streaming) -->
			<div class="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<MonitorPlay class="h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
					</span>
					<div>
						<h2 class="text-sm font-bold text-[var(--text)]">{L['status.sfu']}</h2>
						<p class="text-xs text-[var(--text-subtle)]">{L['status.sfuDesc']}</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<span class="relative flex h-2.5 w-2.5" aria-hidden="true">
						{#if sfu === 'ok'}
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75"></span>
						{/if}
						<span class="relative inline-flex h-2.5 w-2.5 rounded-full {dotClass(sfu)}"></span>
					</span>
					<span class="text-sm font-semibold text-[var(--text)]">{label(sfu)}</span>
				</div>
			</div>

			<!-- Live rooms -->
			<div class="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Users class="h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
					</span>
					<div>
						<h2 class="text-sm font-bold text-[var(--text)]">{L['status.rooms']}</h2>
						<p class="text-xs text-[var(--text-subtle)]">{L['status.roomsDesc']}</p>
					</div>
				</div>
				<span class="font-mono text-2xl font-bold text-[var(--brand)]">{rooms ?? '—'}</span>
			</div>
		</div>

		<div class="mt-6 flex items-center justify-between text-xs text-[var(--text-subtle)]">
			<span>
				{L['status.lastCheck']}: {lastCheck ? lastCheck.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US') : '—'}
			</span>
			<button
				onclick={check}
				disabled={refreshing}
				class="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs transition-colors hover:text-[var(--brand)] disabled:opacity-50"
			>
				<RefreshCw class="h-3.5 w-3.5 {refreshing ? 'animate-spin' : ''}" aria-hidden="true" />
				{L['status.refresh']}
			</button>
		</div>
	</main>
</div>
