<script lang="ts">
	import { Volume2, Volume1, VolumeX, Maximize, Minimize, Share2 } from 'lucide-svelte';
	import Pill from './Pill.svelte';
	import type { FloatingReaction } from '$lib/types/room';

	interface Props {
		/** Mute state of the local video. */
		muted: boolean;
		/** Volume 0-100. */
		volume: number;
		fullscreen: boolean;
		hostMuted: boolean;
		assignedUsername: string;
		/** Floating reactions to render over the video. */
		reactions: FloatingReaction[];
		/** Expose the <video> element to the parent. */
		onVideoMount: (el: HTMLVideoElement) => void;
		/** Expose the container (for fullscreen). */
		onContainerMount: (el: HTMLDivElement) => void;
		onToggleMute: () => void;
		onVolumeChange: (v: number) => void;
		onToggleFullscreen: () => void;
		onShare: () => void;
		onShowShortcuts: () => void;
		onVideoClick: () => void;
	}

	let {
		muted,
		volume,
		fullscreen,
		hostMuted,
		assignedUsername,
		reactions,
		onVideoMount,
		onContainerMount,
		onToggleMute,
		onVolumeChange,
		onToggleFullscreen,
		onShare,
		onShowShortcuts,
		onVideoClick,
	}: Props = $props();

	let videoEl: HTMLVideoElement | null = $state(null);
	let containerEl: HTMLDivElement | null = $state(null);

	// Propagate element refs up to the parent. Reading the prop inside $effect is
	// intentional; the parent's callback identity is stable in practice.
	$effect(() => {
		const el = videoEl;
		if (el) onVideoMount(el);
	});
	$effect(() => {
		const el = containerEl;
		if (el) onContainerMount(el);
	});
</script>

<div
	bind:this={containerEl}
	class="group relative h-full w-full shrink-0 bg-black md:shrink md:flex-1"
	role="region"
	aria-label="Video en vivo"
>
	<!-- Video -->
	<video
		bind:this={videoEl}
		autoplay
		muted
		playsinline
		onclick={onVideoClick}
		class="h-full w-full cursor-pointer object-contain"
		title="Haz clic para activar audio"
	></video>

	<!-- Top-left overlays -->
	<div class="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
		<Pill tone="danger" pulse>EN VIVO</Pill>
		{#if hostMuted}
			<Pill tone="warning">
				<VolumeX class="h-3 w-3" />
				Silenciado
			</Pill>
		{/if}
		{#if assignedUsername}
			<span class="hidden items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-[var(--text-muted)] glass md:flex">
				@{assignedUsername}
			</span>
		{/if}
	</div>

	<!-- Bottom controls (hover / focus-within) -->
	<div
		class="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
	>
		<div class="pointer-events-auto flex items-center gap-3">
			<!-- Mute -->
			<button
				onclick={onToggleMute}
				class="p-1 text-white transition-colors hover:text-white/80"
				title={muted ? 'Activar sonido' : 'Silenciar'}
				aria-label={muted ? 'Activar sonido' : 'Silenciar'}
			>
				{#if muted || volume === 0}
					<VolumeX class="h-5 w-5" />
				{:else if volume < 50}
					<Volume1 class="h-5 w-5" />
				{:else}
					<Volume2 class="h-5 w-5" />
				{/if}
			</button>

			<!-- Volume slider (desktop only) -->
			<div class="hidden max-w-[160px] flex-1 items-center gap-2 md:flex">
				<input
					type="range"
					min="0"
					max="100"
					value={volume}
					oninput={(e) => onVolumeChange(Number((e.target as HTMLInputElement).value))}
					class="volume-slider flex-1"
					title="Volumen: {volume}%"
					aria-label="Volumen"
				/>
				<span class="w-8 text-right font-mono text-[10px] text-white/60">{volume}%</span>
			</div>

			<div class="flex-1"></div>

			<!-- Share -->
			<button
				onclick={onShare}
				class="p-1 text-white/70 transition-colors hover:text-white"
				title="Compartir enlace"
				aria-label="Compartir enlace"
			>
				<Share2 class="h-4 w-4" />
			</button>

			<!-- Fullscreen -->
			<button
				onclick={onToggleFullscreen}
				class="p-1 text-white/70 transition-colors hover:text-white"
				title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
				aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
			>
				{#if fullscreen}
					<Minimize class="h-5 w-5" />
				{:else}
					<Maximize class="h-5 w-5" />
				{/if}
			</button>

			<!-- Shortcuts help -->
			<button
				onclick={onShowShortcuts}
				class="p-1 font-mono text-xs text-white/50 transition-colors hover:text-white/80"
				title="Atajos de teclado"
				aria-label="Atajos de teclado"
			>
				?
			</button>
		</div>
	</div>

	<!-- Floating reactions -->
	{#each reactions as reaction (reaction.id)}
		<div
			class="pointer-events-none absolute z-10 select-none text-3xl"
			style:left="{reaction.x}%"
			style:bottom="{reaction.bottom}px"
			style:font-size="{reaction.fontSize}rem"
			style:transform="translateX({reaction.xOffset}) rotate({reaction.rotation})"
			style:animation="floatUp {reaction.duration}s ease-out {reaction.delay}s both"
		>
			{reaction.emoji}
		</div>
	{/each}
</div>

<style>
	/* Custom volume slider for the viewer video controls. */
	input[type='range'].volume-slider {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.2);
		outline: none;
		cursor: pointer;
	}
	input[type='range'].volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}
	input[type='range'].volume-slider::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: white;
		border: none;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}
</style>
