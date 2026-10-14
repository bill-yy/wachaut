<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		// Admin subdomain (wadmin.*) showing a non-admin route → send to the
		// login page. Hostname prefix check covers every environment
		// (wadmin.wachaut.com, wadmin.billytech.es, local wadmin.localhost…).
		if (typeof window !== 'undefined' && window.location.hostname.startsWith('wadmin.')) {
			if (!window.location.pathname.startsWith('/admin')) {
				goto('/admin');
			}
		}
	});
</script>

<div>
	{@render children()}
	<Toaster />
</div>
