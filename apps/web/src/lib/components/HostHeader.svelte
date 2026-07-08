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
		degraded: { color: 'bg-[var(--warning)]', bg: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/25', label: 'Conexión débil' },
		poor: { color: 'bg-[var(--danger)]', bg: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/25', label: 'Inestable' },
	};
</script>

<header class="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 sm:px-4">
	<div class="flex min-w-0 items-center gap-1.5">
		<IconButton label="Volver" onclick={onBack} variant="ghost" size="md">
			<ArrowLeft class="h-4 w-4" />
		</IconButton>
		<span class="min-w-0">
			<Brand size="sm" />
		</span>
	</div>

	<div class="flex items-center gap-1 sm:gap-1.5">
		{#if sharing}
			<!-- LIVE badge: dot + label (icon-only on mobile, sr-only for a11y) -->
			<span class="flex items-center gap-1.5 rounded-full bg-[var(--danger)]/10 px-2 py-1 text-xs font-bold text-[var(--danger)] animate-fade-in sm:px-2.5" role="status">
				<span class="relative flex h-1.5 w-1.5">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-75"></span>
					<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--danger)]"></span>
				</span>
				<span class="hidden sm:inline">EN VIVO</span>
				<span class="sr-only">En vivo</span>
			</span>
			<!-- Health pill: dot only on mobile, label on sm+ -->
			<span class={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium sm:px-2.5 ${healthMeta[health].bg}`} role="status">
				<span class={`h-1.5 w-1.5 rounded-full ${healthMeta[health].color}`}></span>
				<span class="hidden sm:inline">{healthMeta[health].label}</span>
				<span class="sr-only">{healthMeta[health].label}</span>
			</span>
		{/if}

		<!-- Viewer count -->
		<button
			onclick={onOpenViewers}
			class="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] transition-all hover:border-[var(--brand)]/40 active:scale-95 sm:px-3 {viewerCount > 0 ? 'shadow-glow' : ''}"
			aria-label="Ver espectadores"
		>
			<Users class={`h-3.5 w-3.5 ${viewerCount > 0 ? 'text-[var(--brand)]' : 'text-[var(--text-subtle)]'}`} />
			{viewerCount}
		</button>

		<IconButton
			label={notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
			onclick={onToggleNotifications}
			variant="ghost"
			size="md"
		>
			{#if notificationsMuted}
				<BellOff class="h-4 w-4 text-[var(--text-subtle)]" />
			{:else}
				<Bell class="h-4 w-4" />
			{/if}
		</IconButton>
	</div>
	</header>
