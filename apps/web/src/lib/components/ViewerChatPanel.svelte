<script lang="ts">
	import { MessageCircle, Activity, Bell, BellOff } from 'lucide-svelte';
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
	}: Props = $props();

	const qualityColor = {
		buena: 'bg-[var(--success)]',
		regular: 'bg-[var(--warning)]',
		desconocida: 'bg-[var(--text-subtle)]',
	};
</script>

<aside
	class="flex w-80 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]
	       max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-80 max-md:max-w-[85vw] max-md:transition-transform max-md:duration-300
	       {open ? 'max-md:translate-x-0' : 'max-md:translate-x-full'}"
>
	<!-- Unified header: chat label + stats + notifications -->
	<div class="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
		<div class="flex items-center gap-1.5">
			<MessageCircle class="h-3.5 w-3.5 text-[var(--text-subtle)]" />
			<span class="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">Chat</span>
			{#if messages.length > 0}
				<span class="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--surface-2)] px-1 text-[10px] font-medium text-[var(--text-subtle)]">{messages.length}</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if connectionStats.resolution}
				<div class="hidden items-center gap-1 text-[10px] text-[var(--text-subtle)] sm:flex">
					<Activity class="h-3 w-3" />
					<span class="h-1.5 w-1.5 rounded-full {qualityColor[connectionQuality]}"></span>
					<span class="font-mono">{connectionStats.resolution}</span>
					{#if connectionStats.bitrate}
						<span>· {connectionStats.bitrate}</span>
					{/if}
				</div>
			{/if}
			<button
				onclick={onToggleNotifications}
				class="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-2)]"
				title={notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
				aria-label={notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
			>
				{#if notificationsMuted}
					<BellOff class="h-3.5 w-3.5 text-[var(--text-subtle)]" />
				{:else}
					<Bell class="h-3.5 w-3.5" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Messages + input (ChatPanel without its own header to avoid duplication) -->
	<ChatPanel {messages} bind:value onSend={onSend} showCounter={false} showHeader={false} placeholder="Escribe un mensaje…" />

	<!-- Reactions row -->
	<div class="relative shrink-0 border-t border-[var(--border)] px-4 py-2">
		<EmotePicker
			favorites={favoriteEmojis}
			open={showEmotePicker}
			onSend={onSendReaction}
			onToggle={onToggleEmotePicker}
			onClose={onCloseEmotePicker}
		/>
	</div>
</aside>
