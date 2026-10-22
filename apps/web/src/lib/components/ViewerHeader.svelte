<script lang="ts">
	import Brand from './Brand.svelte';
	import IconButton from './IconButton.svelte';
	import { t } from '$lib/i18n/index.svelte';
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
			label={notificationsMuted ? t('comp.unmuteNotif') : t('comp.muteNotif')}
			onclick={onToggleNotifications}
			variant="ghost"
			size="md"
		>
			{#if notificationsMuted}
				<BellOff class="h-4 w-4 text-[var(--text-subtle)]" aria-hidden="true" />
			{:else}
				<Bell class="h-4 w-4" aria-hidden="true" />
			{/if}
		</IconButton>
	</header>
