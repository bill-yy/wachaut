<script lang="ts">
	import { writable } from 'svelte/store';

	const roomId = writable('');
	const pin = writable('');
	const roomUrl = writable('');
	const isLoading = writable(true);

	import { onMount } from 'svelte';

	onMount(() => {
		roomId.set(crypto.randomUUID());
		pin.set(Math.floor(100000 + Math.random() * 900000).toString());
		roomUrl.set(`${window.location.origin}/room/${$roomId}`);
		isLoading.set(false);
	});
</script>

{#if $isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<p>Cargando...</p>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<h1>Sala: {$roomId}</h1>
		<p>PIN: {$pin}</p>
	</div>
{/if}
