<script lang="ts">
	import Modal from './Modal.svelte';
	import { t } from '$lib/i18n/index.svelte';
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

<Modal open={open} title={t('room.viewersTitle')} label={t('room.viewersLabel')} size="md" onClose={onClose}>
	<div class="mb-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
		<Users class="h-4 w-4" aria-hidden="true" />
		<span>{t(count === 1 ? 'room.viewersConnectedOne' : 'room.viewersConnectedMany', { count })}</span>
	</div>

		{#if viewers.length === 0}
			<div class="flex flex-col items-center gap-2 py-8 text-center">
				<UserX class="h-8 w-8 text-[var(--text-subtle)]" aria-hidden="true" />
				<p class="text-sm text-[var(--text-muted)]">{t('room.viewersEmpty')}</p>
			</div>
		{:else}
			<div class="max-h-64 space-y-2 overflow-y-auto overscroll-contain">
				{#each viewers as viewer (viewer.viewerId)}
					<div class="flex items-center justify-between gap-2 rounded-xl bg-[var(--surface-2)] p-3">
						<div class="flex min-w-0 items-center gap-2">
							<span class="relative flex h-2 w-2 shrink-0" title={viewer.connected === false ? t('room.disconnected') : t('room.connected')}>
								{#if viewer.connected !== false}
									<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" aria-hidden="true"></span>
									<span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" aria-hidden="true"></span>
								{:else}
									<span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--text-subtle)]" aria-hidden="true"></span>
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
							class="flex min-h-[36px] shrink-0 items-center rounded-lg bg-[var(--danger)]/12 px-3 py-1.5 text-xs font-medium text-[var(--danger)] transition-[background-color,transform] hover:bg-[var(--danger)]/20 active:scale-95"
							aria-label={t('room.kickAria', { name: viewer.name || viewer.viewerId.slice(0, 8) })}
						>
							{t('room.kick')}
						</button>
					</div>
				{/each}
			</div>
		{/if}

	<div class="mt-4 border-t border-[var(--border)] pt-3">
		<p class="text-xs text-[var(--text-subtle)]">
			{t('room.kickHintPre')}
			<code class="rounded bg-[var(--surface-2)] px-1 font-mono">/kick &lt;usuario&gt;</code>
			{t('room.kickHintPost')}
		</p>
	</div>
</Modal>
