<script lang="ts">
	import Brand from './Brand.svelte';
	import IconButton from './IconButton.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ArrowLeft, Users, Bell, BellOff, PanelRight } from 'lucide-svelte';

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

	const healthMeta: Record<Health, { color: string; bg: string; label: () => string }> = {
		good: { color: 'bg-[var(--success)]', bg: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/25', label: () => t('comp.healthGood') },
		degraded: { color: 'bg-[var(--warning)]', bg: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/25', label: () => t('comp.healthDegraded') },
		poor: { color: 'bg-[var(--danger)]', bg: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/25', label: () => t('comp.healthPoor') },
	};
</script>

<header class="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-2 py-2 sm:px-4">
	<div class="flex min-w-0 items-center gap-1.5">
		<IconButton label={t('comp.back')} onclick={onBack} variant="ghost" size="md">
			<ArrowLeft class="h-4 w-4" aria-hidden="true" />
		</IconButton>
		<span class="min-w-0">
			<Brand size="sm" />
		</span>
	</div>

	<div class="flex items-center gap-1 sm:gap-1.5">
		{#if sharing}
			<!-- LIVE badge: dot + label (icon-only on mobile, sr-only for a11y) -->
			<span class="flex items-center gap-1.5 rounded-full bg-[var(--danger)]/10 px-2 py-1 text-xs font-bold text-[var(--danger)] animate-fade-in sm:px-2.5" role="status">
				<span class="relative flex h-1.5 w-1.5" aria-hidden="true">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-75"></span>
					<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--danger)]"></span>
				</span>
				<span class="hidden sm:inline">{t('comp.liveBadge')}</span>
				<span class="sr-only">{t('comp.liveSr')}</span>
			</span>
			<!-- Health pill: dot only on mobile, label on sm+ -->
			<span class={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium sm:px-2.5 ${healthMeta[health].bg}`} role="status">
				<span class={`h-1.5 w-1.5 rounded-full ${healthMeta[health].color}`} aria-hidden="true"></span>
				<span class="hidden sm:inline">{healthMeta[health].label()}</span>
				<span class="sr-only">{healthMeta[health].label()}</span>
			</span>
		{/if}

		<!-- Viewer count -->
		<button
			onclick={onOpenViewers}
			class="flex h-11 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-medium text-[var(--text)] transition-[border-color,transform,box-shadow] hover:border-[var(--brand)]/40 active:scale-95 {viewerCount
				? 'shadow-glow'
				: ''}"
			aria-label={t('comp.viewViewers')}
		>
			<Users class={`h-3.5 w-3.5 ${viewerCount > 0 ? 'text-[var(--brand)]' : 'text-[var(--text-subtle)]'}`} aria-hidden="true" />
			{viewerCount}
		</button>

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

		<!-- Panel toggle (mobile only: on md+ the sidebar is always visible) -->
		<button
			onclick={onToggleChat}
			class="relative flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-muted)] transition-[background-color,color] hover:bg-[var(--surface-2)] hover:text-[var(--text)] md:hidden"
			aria-label={chatOpen ? t('room.closePanel') : t('room.openPanel')}
			aria-expanded={chatOpen}
		>
			<PanelRight class="h-5 w-5" aria-hidden="true" />
			{#if unreadCount > 0 && !chatOpen}
				<span
					class="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-black"
					aria-hidden="true"
				>
					{unreadCount > 9 ? '9+' : unreadCount}
				</span>
				<span class="sr-only">{t('room.unreadMessages', { count: unreadCount })}</span>
			{/if}
		</button>
	</div>
</header>
