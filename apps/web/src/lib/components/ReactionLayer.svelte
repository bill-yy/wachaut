<script lang="ts">
	import type { FloatingReaction, ConfettiParticle } from '$lib/types/room';

	interface Props {
		/** Floating emoji reactions currently animating. */
		reactions: FloatingReaction[];
		/** When true, render the first-viewer confetti celebration. */
		celebrate: boolean;
		/** Confetti particles for the celebration. */
		confetti: ConfettiParticle[];
	}

	let { reactions, celebrate, confetti }: Props = $props();
</script>

<!-- Floating emoji reactions -->
{#each reactions as reaction (reaction.id)}
	<div
		class="pointer-events-none absolute z-10 select-none text-4xl"
		style:left="{reaction.x}%"
		style:bottom="{reaction.bottom}px"
		style:font-size="{reaction.fontSize}rem"
		style:transform="translateX({reaction.xOffset}) rotate({reaction.rotation})"
		style:animation="floatUp {reaction.duration}s ease-out {reaction.delay}s both"
	>
		{reaction.emoji}
	</div>
{/each}

<!-- First-viewer celebration -->
{#if celebrate}
	<div class="pointer-events-none fixed inset-0 z-[60] animate-fade-in">
		{#each confetti as p (p.id)}
			<div
				class="absolute"
				style="
					left: {p.x}%;
					top: -20px;
					width: {p.size}px;
					height: {p.size}px;
					background: {p.type === 'rect' ? p.color : 'transparent'};
					border-radius: {p.borderRadius};
					animation: confettiFall {p.duration}s ease-in {p.delay}s forwards;
					opacity: 0;
					transform: rotate({p.rotation}deg);
					font-size: {p.size * 1.5}px;
					line-height: 1;
				"
			>
				{#if p.type === 'emoji'}{p.emoji}{/if}
			</div>
		{/each}
		<div class="fixed inset-0 flex items-center justify-center">
			<div
				class="glass rounded-3xl border border-[var(--border)] px-8 py-6 text-center shadow-2xl"
				style="animation: celebrationPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275);"
			>
				<div class="mb-3 text-5xl">🎉</div>
				<h2 class="mb-1 text-xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">
					¡Primer espectador!
				</h2>
				<p class="text-sm text-[var(--text-muted)]">Alguien está viendo tu pantalla</p>
				<div class="mt-3 flex items-center justify-center gap-1.5">
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]"></span>
					</span>
					<span class="text-xs font-medium text-[var(--success)]">En vivo</span>
				</div>
			</div>
		</div>
	</div>
{/if}
