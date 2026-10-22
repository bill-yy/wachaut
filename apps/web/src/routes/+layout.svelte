<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { goto, afterNavigate } from '$app/navigation';
	import { page as pageState } from '$app/state';
	import Toaster from '$lib/components/Toaster.svelte';
	import { trackPageView, maintenance } from '$lib/tracker.svelte';
	import { installGlobalErrorHandlers } from '$lib/error-report';
	import { t } from '$lib/i18n/index.svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		// Uncaught exceptions / unhandled rejections → error tracker (panel).
		installGlobalErrorHandlers();
		// Admin subdomain (wadmin.*) showing a non-admin route → send to the
		// login page. Hostname prefix check covers every environment.
		if (window.location.hostname.startsWith('wadmin.')) {
			if (!window.location.pathname.startsWith('/admin')) {
				goto('/admin');
			}
		}
	});

	// afterNavigate fires on the initial load AND on every SPA navigation —
	// one pageview per route change, admin pages excluded.
	afterNavigate(() => {
		if (!pageState.url.pathname.startsWith('/admin')) {
			trackPageView(pageState.url.pathname);
		}
	});
</script>

<div>
	{#if maintenance.active}
		<div
			class="fixed inset-x-0 top-0 z-50 border-b border-[var(--warning)]/40 bg-[var(--warning)]/15 px-4 py-2 text-center text-sm text-[var(--warning)] backdrop-blur-lg"
			style="padding-top: max(0.5rem, env(safe-area-inset-top));"
			role="status"
		>
			{t('layout.maintenance')}
		</div>
	{/if}
	{@render children()}
	<Toaster />
</div>
