<script lang="ts">
	import { SmilePlus } from 'lucide-svelte';
	import { clickOutside } from '$lib/actions';
	import { EMOTE_CATEGORIES } from '$lib/utils/emotes';

	interface Props {
		/** Favorite emojis shown in the quick row (MRU). */
		favorites: string[];
		/** Whether the expanded grid is open. */
		open: boolean;
		/** Send a reaction emoji. */
		onSend: (emoji: string) => void;
		/** Toggle the expanded grid. */
		onToggle: () => void;
		/** Close the expanded grid (click-outside / escape). */
		onClose: () => void;
	}

	let { favorites, open, onSend, onToggle, onClose }: Props = $props();
</script>

<div class="relative pt-2" use:clickOutside={onClose}>
	<!-- Favorites quick row -->
	<div class="flex items-center justify-center gap-2">
		{#each favorites as emoji (emoji)}
			<button
				onclick={() => onSend(emoji)}
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-xl transition-all hover:bg-[var(--border)] active:scale-90"
				aria-label="Enviar reacción {emoji}"
			>
				{emoji}
			</button>
		{/each}
		<button
			onclick={onToggle}
			class="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-[var(--border)] active:scale-90 {open
				? 'bg-[var(--border)] text-[var(--text)]'
				: 'bg-[var(--surface-2)] text-[var(--text-subtle)]'}"
			aria-label="Más emojis"
			aria-expanded={open}
		>
			<SmilePlus class="h-5 w-5" />
		</button>
	</div>

	<!-- Expandable grid -->
	{#if open}
		<div
			class="glass absolute bottom-full left-0 right-0 z-10 mb-2 max-h-64 overflow-y-auto rounded-xl p-3 shadow-2xl"
		>
			{#each EMOTE_CATEGORIES as category (category.label)}
				<div class="mb-2 last:mb-0">
					<p class="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
						{category.label}
					</p>
					<div class="grid grid-cols-5 gap-1">
						{#each category.emojis as emoji (emoji)}
							<button
								onclick={() => onSend(emoji)}
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-xl transition-all duration-150 hover:bg-[var(--border)] active:scale-90"
								aria-label="Enviar {emoji}"
							>
								{emoji}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
