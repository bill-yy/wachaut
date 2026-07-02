<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div>
	{@render children()}
	<Toaster />
</div>
