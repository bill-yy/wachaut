<script lang="ts">
	import Brand from './Brand.svelte';
	import IconButton from './IconButton.svelte';
	import { ArrowLeft, Users, Bell, BellOff } from 'lucide-svelte';

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

	const healthMeta: Record<Health, { color: string; bg: string; label: string }> = {
		good: { color: 'bg-[var(--success)]', bg: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/25', label: 'Estable' },
		degraded: { color: 'bg-[var(--warning)]', bg: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/25', label: 'Estableciendo' },
		poor: { color: 'bg-[var(--danger)]', bg: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/25', label: 'Inestable' },
	};
</script>

<header class="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
	<div class="flex items-center gap-1.5">
		<IconButton label="Volver" onclick={onBack} variant="ghost" size="sm">
			<ArrowLeft class="h-4 w-4" />
		</IconButton>
		<Brand size="sm" />
	</div>

	<div class="flex items-center gap-1.5">
		{#if sharing}
			<!-- LIVE badge: pulsing red dot + label -->
			<span class="flex items-center gap-1.5 rounded-full bg-[var(--danger)]/10 px-2.5 py-1 text-xs font-bold text-[var(--danger)] animate-fade-in">
				<span class="relative flex h-1.5 w-1.5">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-75"></span>
					<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--danger)]"></span>
				</span>
				EN VIVO
			</span>
			<!-- Health pill -->
			<span class={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${healthMeta[health].bg}`}>
				<span class={`h-1.5 w-1.5 rounded-full ${healthMeta[health].color}`}></span>
				{healthMeta[health].label}
			</span>
		{/if}

		<!-- Viewer count: chip with glow when viewers present -->
		<button
			onclick={onOpenViewers}
			class="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-all hover:border-[var(--brand)]/40 active:scale-95 {viewerCount > 0 ? 'shadow-glow' : ''}"
			aria-label="Ver espectadores"
		>
			<Users class={`h-3.5 w-3.5 ${viewerCount > 0 ? 'text-[var(--brand)]' : 'text-[var(--text-subtle)]'}`} />
			{viewerCount}
		</button>

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
		</div>
	</header>
