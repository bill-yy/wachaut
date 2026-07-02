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
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
		<div class="flex items-center gap-2">
			<MessageCircle class="h-4 w-4 text-[var(--text-subtle)]" />
			<span class="text-sm font-semibold text-[var(--text)]">Chat</span>
			<span class="text-xs text-[var(--text-subtle)]">({messages.length})</span>
		</div>
		<div class="flex items-center gap-1 text-[var(--text-subtle)]">
			<Terminal class="h-3 w-3" />
			<span class="font-mono text-[10px]">/help</span>
		</div>
	</div>

	<!-- Messages -->
	<div
		bind:this={container}
		class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
		aria-live="polite"
		aria-label="Mensajes de chat"
	>
		{#if messages.length === 0}
			<div class="flex h-full flex-col items-center justify-center py-8 text-center">
				<MessageCircle class="mb-2 h-8 w-8 text-[var(--text-subtle)] opacity-50" />
				<p class="text-sm text-[var(--text-muted)]">Aún no hay mensajes</p>
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
