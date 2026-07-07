<script lang="ts">
	import Brand from './Brand.svelte';
	import IconButton from './IconButton.svelte';
	import { Bell, BellOff } from 'lucide-svelte';

	interface Props {
		notificationsMuted: boolean;
		onToggleNotifications: () => void;
	}

	let { notificationsMuted, onToggleNotifications }: Props = $props();
</script>

<header class="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
	<Brand size="sm" />
	<IconButton
		label={notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
		onclick={onToggleNotifications}
		variant="ghost"
		size="sm"
	>
		{#if notificationsMuted}
			<BellOff class="h-4 w-4 text-[var(--text-subtle)]" />
		{:else}
			<Bell class="h-4 w-4" />
		{/if}
	</IconButton>
</header>
