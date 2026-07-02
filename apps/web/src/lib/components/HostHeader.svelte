<script lang="ts">
	import Brand from './Brand.svelte';
	import IconButton from './IconButton.svelte';
	import Pill from './Pill.svelte';
	import { ArrowLeft, Users, Bell, BellOff, MessageCircle } from 'lucide-svelte';

	type Health = 'good' | 'degraded' | 'poor';

	interface Props {
		sharing: boolean;
		health: Health;
		viewerCount: number;
		notificationsMuted: boolean;
		chatOpen: boolean;
		unreadCount: number;
		onBack: () => void;
		onToggleNotifications: () => void;
		onToggleChat: () => void;
		onOpenViewers: () => void;
	}

	let {
		sharing,
		health,
		viewerCount,
		notificationsMuted,
		chatOpen,
		unreadCount,
		onBack,
		onToggleNotifications,
		onToggleChat,
		onOpenViewers,
	}: Props = $props();

	const healthMeta: Record<Health, { tone: 'success' | 'warning' | 'danger'; label: string }> = {
		good: { tone: 'success', label: 'Estable' },
		degraded: { tone: 'warning', label: 'Estableciendo' },
		poor: { tone: 'danger', label: 'Inestable' },
	};
</script>

<header class="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-[var(--surface)]">
	<div class="flex items-center gap-2">
		<IconButton label="Volver" onclick={onBack} variant="ghost">
			<ArrowLeft class="h-5 w-5" />
		</IconButton>
		<Brand size="md" />
	</div>

	<div class="flex items-center gap-2">
		{#if sharing}
			<Pill tone="danger" pulse class="animate-fade-in">EN VIVO</Pill>
			<Pill tone={healthMeta[health].tone} dot={!health ? false : true}>
				{healthMeta[health].label}
			</Pill>
		{/if}

		<button
			onclick={onOpenViewers}
			class="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 transition-all hover:border-[var(--text-subtle)] active:scale-95"
			aria-label="Ver espectadores"
		>
			<Users class="h-4 w-4 text-[var(--text-subtle)]" />
			<span class="text-sm font-medium text-[var(--text)]">{viewerCount}</span>
		</button>

		<IconButton
			label={notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
			onclick={onToggleNotifications}
			variant="ghost"
		>
			{#if notificationsMuted}
				<BellOff class="h-5 w-5 text-[var(--text-subtle)]" />
			{:else}
				<Bell class="h-5 w-5" />
			{/if}
		</IconButton>

		<div class="relative">
			<IconButton
				label="Chat"
				onclick={onToggleChat}
				variant={chatOpen ? 'solid' : 'ghost'}
			>
				<MessageCircle class="h-5 w-5" />
			</IconButton>
			{#if unreadCount > 0 && !chatOpen}
				<span
					class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white"
				>
					{unreadCount > 9 ? '9+' : unreadCount}
				</span>
			{/if}
		</div>
	</div>
</header>
