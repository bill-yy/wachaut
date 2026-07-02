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

<header class="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm">
	<div class="mx-auto flex max-w-5xl items-center gap-2">
		<Brand size="md" />
		<div class="flex-1"></div>
		<IconButton
			label={notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
			onclick={onToggleNotifications}
			variant="ghost"
		>
			{#if notificationsMuted}
				<BellOff class="h-5 w-5" />
			{:else}
				<Bell class="h-5 w-5" />
			{/if}
		</IconButton>
	</div>
</header>
