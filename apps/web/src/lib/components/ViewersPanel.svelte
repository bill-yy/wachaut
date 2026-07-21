<script lang="ts">
	import Modal from './Modal.svelte';
	import { Users, UserX } from 'lucide-svelte';
	import type { Viewer } from '$lib/types/room';

	interface Props {
		open: boolean;
		viewers: Viewer[];
		count: number;
		onKick: (viewerId: string) => void;
		onClose: () => void;
	}

	let { open, viewers, count, onKick, onClose }: Props = $props();
</script>

<Modal open={open} title="Espectadores" label="Panel de espectadores" size="md" onClose={onClose}>
	<div class="mb-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
		<Users class="h-4 w-4" />
		<span>{count} conectado{count === 1 ? '' : 's'}</span>
	</div>

		{#if viewers.length === 0}
			<div class="flex flex-col items-center gap-2 py-8 text-center">
				<UserX class="h-8 w-8 text-[var(--text-subtle)]" />
				<p class="text-sm text-[var(--text-muted)]">No hay espectadores conectados</p>
			</div>
		{:else}
			<div class="max-h-64 space-y-2 overflow-y-auto">
				{#each viewers as viewer (viewer.viewerId)}
					<div class="flex items-center justify-between rounded-xl bg-[var(--surface-2)] p-3">
						<div class="flex items-center gap-2">
							<span class="relative flex h-2 w-2" title={viewer.connected === false ? 'Desconectado' : 'Conectado'}>
								{#if viewer.connected !== false}
									<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75"></span>
									<span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]"></span>
								{:else}
									<span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--text-subtle)]"></span>
								{/if}
							</span>
							<div class="min-w-0">
								<span class="block truncate text-sm font-semibold text-[var(--text)]">
									@{viewer.name || viewer.viewerId.slice(0, 8)}
								</span>
								<span class="block font-mono text-[10px] text-[var(--text-subtle)]">{viewer.viewerId.slice(0, 8)}…</span>
							</div>
						</div>
						<button
							onclick={() => onKick(viewer.viewerId)}
							class="rounded-lg bg-[var(--danger)]/12 px-3 py-1 text-xs font-medium text-[var(--danger)] transition-all hover:bg-[var(--danger)]/20 active:scale-95"
						>
							Expulsar
						</button>
					</div>
				{/each}
			</div>
		{/if}

	<div class="mt-4 border-t border-[var(--border)] pt-3">
		<p class="text-xs text-[var(--text-subtle)]">
			También puedes usar
			<code class="rounded bg-[var(--surface-2)] px-1 font-mono">/kick &lt;usuario&gt;</code>
			en el chat
		</p>
	</div>
</Modal>
