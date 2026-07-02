<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		if ('serviceWorker' in navigator) {
			void navigator.serviceWorker.register('/sw.js', { scope: '/' });
		}
	});
</script>

<div>
	{@render children()}
	<Toaster />
</div>
