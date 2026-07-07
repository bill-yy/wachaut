<script lang="ts">
	import { tick } from 'svelte';
	import { MessageCircle, Send, Terminal, Shield } from 'lucide-svelte';
	import type { ChatMessage } from '$lib/utils/chat';
	import { SENDER_HOST, SENDER_SYSTEM, formatChatTime } from '$lib/utils/chat';

	interface Props {
		/** Chat messages (reactive). */
		messages: ChatMessage[];
		/** Current draft text (two-way bound). */
		value: string;
		/** Max length for the input. */
		maxLength?: number;
		/** Show the char counter (host uses it, viewer may not). */
		showCounter?: boolean;
		/** Show the header row (hide when embedded in a panel with its own header). */
		showHeader?: boolean;
		/** Placeholder text. */
		placeholder?: string;
		/** Send the current draft. */
		onSend: () => void;
	}

	let {
		messages,
		value = $bindable(),
		maxLength = 500,
		showCounter = true,
		showHeader = true,
		placeholder = 'Escribe un mensaje o /comando…',
		onSend,
	}: Props = $props();

	let container: HTMLDivElement | null = $state(null);

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSend();
		}
	}

	// Auto-scroll to bottom when new messages arrive.
	$effect(() => {
		void messages.length;
		if (container) {
			tick().then(() => {
				if (container) container.scrollTop = container.scrollHeight;
			});
		}
	});
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
	{#if showHeader}
	<!-- Header: compact, coherente con sidebar -->
	<div class="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
		<div class="flex items-center gap-1.5">
			<MessageCircle class="h-3.5 w-3.5 text-[var(--text-subtle)]" />
			<span class="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">Chat</span>
			{#if messages.length > 0}
				<span class="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--surface-2)] px-1 text-[10px] font-medium text-[var(--text-subtle)]">{messages.length}</span>
			{/if}
		</div>
		<div class="flex items-center gap-1 text-[var(--text-subtle)]">
			<Terminal class="h-3 w-3" />
			<span class="font-mono text-[10px]">/help</span>
		</div>
	</div>
	{/if}

	<!-- Messages -->
	<div
		bind:this={container}
		class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
		aria-live="polite"
		aria-label="Mensajes de chat"
	>
		{#if messages.length === 0}
			<div class="flex h-full flex-col items-center justify-center px-6 text-center">
				<div class="relative mb-4">
					<div class="absolute inset-0 rounded-full opacity-20 blur-2xl gradient-brand"></div>
					<div class="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
						<MessageCircle class="h-6 w-6 text-[var(--text-subtle)]" />
					</div>
				</div>
				<p class="text-sm font-medium text-[var(--text-muted)]">Aún no hay mensajes</p>
				<p class="mt-1 text-xs text-[var(--text-subtle)]">Los mensajes aparecerán aquí</p>
			</div>
		{:else}
			{#each messages.slice(-200) as msg, i (msg.id ?? `${msg.sender}-${msg.timestamp.getTime()}-${i}`)}
				<div
					class="flex flex-col {msg.sender === SENDER_HOST
						? 'items-end'
						: msg.sender === SENDER_SYSTEM
							? 'items-center'
							: 'items-start'}"
				>
					<div class="mb-0.5 flex items-center gap-1.5">
						{#if msg.sender === SENDER_SYSTEM}
							<Shield class="h-3 w-3 text-[var(--text-subtle)]" />
						{/if}
						<span
							class="text-[10px] font-semibold {msg.sender === SENDER_HOST
								? 'text-[var(--text-muted)]'
								: msg.sender === SENDER_SYSTEM
									? 'text-[var(--text-subtle)]'
									: 'text-[var(--brand)]'}"
						>
							{msg.sender}
						</span>
						<span class="text-[10px] text-[var(--text-subtle)]">
							{formatChatTime(msg.timestamp)}
						</span>
					</div>
					<div
						class="max-w-[85%] rounded-2xl px-3 py-2 text-sm {msg.sender === SENDER_HOST
							? 'gradient-brand rounded-br-md text-white'
							: msg.sender === SENDER_SYSTEM
								? 'rounded-xl bg-[var(--surface-2)] text-xs italic text-[var(--text-muted)]'
								: 'rounded-bl-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'}"
					>
						{msg.text}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Input -->
	<div class="border-t border-[var(--border)] p-3">
		<div class="flex items-center gap-2">
			<input
				type="text"
				bind:value
				onkeydown={onKeydown}
				{placeholder}
				maxlength={maxLength}
				aria-label="Mensaje de chat"
				class="input-field flex-1 !py-2.5"
			/>
			<button
				onclick={onSend}
				disabled={!value.trim()}
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-brand text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
				aria-label="Enviar mensaje"
			>
				<Send class="h-4 w-4" />
			</button>
		</div>
		{#if showCounter}
			<div class="mt-1.5 flex items-center justify-between">
				<span class="text-[10px] text-[var(--text-subtle)]">{value.length}/{maxLength}</span>
				<span class="text-[10px] text-[var(--text-subtle)]">/help para comandos</span>
			</div>
		{/if}
	</div>
</div>
