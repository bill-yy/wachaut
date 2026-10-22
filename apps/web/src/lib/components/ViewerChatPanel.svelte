<script lang="ts">
	import { MessageCircle, Activity, Bell, BellOff, X } from 'lucide-svelte';
	import { t } from '$lib/i18n/index.svelte';
	import ChatPanel from './ChatPanel.svelte';
	import EmotePicker from './EmotePicker.svelte';
	import type { ChatMessage } from '$lib/utils/chat';

	interface Props {
		messages: ChatMessage[];
		value: string;
		open: boolean;
		notificationsMuted: boolean;
		connectionStats: { resolution: string; fps: string; bitrate: string };
		connectionQuality: 'buena' | 'regular' | 'desconocida';
		favoriteEmojis: string[];
		showEmotePicker: boolean;
		onSend: () => void;
		onToggleNotifications: () => void;
		onSendReaction: (emoji: string) => void;
		onToggleEmotePicker: () => void;
		onCloseEmotePicker: () => void;
		onClose?: () => void;
	}

	let {
		messages,
		value = $bindable(),
		open,
		notificationsMuted,
		connectionStats,
		connectionQuality,
		favoriteEmojis,
		showEmotePicker,
		onSend,
		onToggleNotifications,
		onSendReaction,
		onToggleEmotePicker,
		onCloseEmotePicker,
		onClose,
	}: Props = $props();

	const qualityColor = {
		buena: 'bg-[var(--success)]',
		regular: 'bg-[var(--warning)]',
		desconocida: 'bg-[var(--text-subtle)]',
	};
</script>

<!-- Mobile: modal drawer — `invisible` when closed removes it (and the chat
     input, buttons and emote row) from the tab order and the a11y tree. -->
<aside
	class="flex w-80 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]
	       max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-80 max-md:max-w-[85vw] max-md:transition-[transform,visibility] max-md:duration-300
	       {open ? 'max-md:visible max-md:translate-x-0' : 'max-md:invisible max-md:translate-x-full'}"
	aria-label={t('room.chatPanelLabel')}
>
	<!-- Unified header: chat label + stats + notifications -->
	<div class="flex shrink-0 items-center justify-between gap-1 border-b border-[var(--border)] px-4 py-2.5">
		<div class="flex min-w-0 items-center gap-1.5">
			<MessageCircle class="h-3.5 w-3.5 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
			<span class="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">Chat</span>
			{#if messages.length > 0}
				<span class="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--surface-2)] px-1 text-[10px] font-medium text-[var(--text-subtle)]">{messages.length}</span>
			{/if}
		</div>
		<div class="flex shrink-0 items-center gap-1">
			{#if connectionStats.resolution}
				<div class="hidden items-center gap-1 text-[10px] text-[var(--text-subtle)] sm:flex">
					<Activity class="h-3 w-3" aria-hidden="true" />
					<span class="h-1.5 w-1.5 rounded-full {qualityColor[connectionQuality]}" aria-hidden="true"></span>
					<span class="font-mono">{connectionStats.resolution}</span>
					{#if connectionStats.bitrate}
						<span>· {connectionStats.bitrate}</span>
					{/if}
				</div>
			{/if}
			<button
				onclick={onToggleNotifications}
				class="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface-2)]"
				title={notificationsMuted ? t('comp.unmuteNotif') : t('comp.muteNotif')}
				aria-label={notificationsMuted ? t('comp.unmuteNotif') : t('comp.muteNotif')}
			>
				{#if notificationsMuted}
					<BellOff class="h-4 w-4 text-[var(--text-subtle)]" aria-hidden="true" />
				{:else}
					<Bell class="h-4 w-4" aria-hidden="true" />
				{/if}
			</button>
			{#if onClose}
				<button
					onclick={onClose}
					class="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] md:hidden"
					aria-label={t('room.closeChat')}
				>
					<X class="h-5 w-5" aria-hidden="true" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Messages + input (ChatPanel without its own header to avoid duplication) -->
	<ChatPanel {messages} bind:value onSend={onSend} showCounter={false} showHeader={false} placeholder={t('comp.chatPlaceholder')} />

	<!-- Reactions row: pb-safe keeps emojis clear of the iOS home indicator -->
	<div class="relative shrink-0 border-t border-[var(--border)] px-4 py-2 pb-safe">
		<EmotePicker
			favorites={favoriteEmojis}
			open={showEmotePicker}
			onSend={onSendReaction}
			onToggle={onToggleEmotePicker}
			onClose={onCloseEmotePicker}
		/>
	</div>
</aside>
