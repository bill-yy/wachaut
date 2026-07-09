<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		// If on the admin subdomain but not on an admin route, redirect to /admin.
		if (typeof window !== 'undefined' && window.location.hostname === 'wadmin.billytech.es') {
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
