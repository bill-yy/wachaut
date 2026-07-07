<script lang="ts">
	import { Volume2, Volume1, VolumeX, Maximize, Minimize, Share2, PictureInPicture2 } from 'lucide-svelte';
	import type { FloatingReaction } from '$lib/types/room';

	interface Props {
		muted: boolean;
		volume: number;
		fullscreen: boolean;
		hostMuted: boolean;
		assignedUsername: string;
		reactions: FloatingReaction[];
		onVideoMount: (el: HTMLVideoElement) => void;
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

	$effect(() => { const el = videoEl; if (el) onVideoMount(el); });
	$effect(() => { const el = containerEl; if (el) onContainerMount(el); });

	let isPip = $state(false);

	async function togglePip() {
		if (!videoEl) return;
		try {
			if (document.pictureInPictureElement) {
				await document.exitPictureInPicture();
			} else {
				await videoEl.requestPictureInPicture();
			}
		} catch {
			/* PiP not supported or blocked */
		}
	}

	// Track PiP state changes (user can exit PiP from the floating window).
	function onPipChange() {
		isPip = !!document.pictureInPictureElement;
	}

	// Svelte action: attach PiP event listeners to the video element.
	function pipEvents(node: HTMLVideoElement) {
		node.addEventListener('enterpictureinpicture', onPipChange);
		node.addEventListener('leavepictureinpicture', onPipChange);
		return {
			destroy() {
				node.removeEventListener('enterpictureinpicture', onPipChange);
				node.removeEventListener('leavepictureinpicture', onPipChange);
			},
		};
	}
</script>

<div
	bind:this={containerEl}
	class="group relative h-full w-full shrink-0 bg-black md:shrink md:flex-1"
	role="region"
	aria-label="Video en vivo"
>
	<video
		bind:this={videoEl}
		autoplay
		muted
		playsinline
		onclick={onVideoClick}
		use:pipEvents
		class="h-full w-full cursor-pointer object-contain"
		title="Haz clic para activar audio"
	></video>

	<!-- Top-left overlays -->
	<div class="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2">
		<!-- LIVE badge: custom, matches HostHeader style -->
		<span class="flex items-center gap-1.5 rounded-full bg-[var(--danger)]/90 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
			<span class="relative flex h-1.5 w-1.5">
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
				<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
			</span>
			EN VIVO
		</span>
		{#if hostMuted}
			<span class="flex items-center gap-1 rounded-full bg-[var(--warning)]/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
				<VolumeX class="h-3 w-3" />
				Silenciado
			</span>
		{/if}
		{#if assignedUsername}
			<span class="hidden items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-xs font-medium text-[var(--text-muted)] backdrop-blur-sm md:flex">
				@{assignedUsername}
			</span>
		{/if}
	</div>

	<!-- Bottom controls: glass bar matching host treatment -->
	<div
		class="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-4 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
	>
		<div class="pointer-events-auto mx-auto flex max-w-2xl items-center gap-2">
			<!-- Mute -->
			<button
				onclick={onToggleMute}
				class="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all hover:bg-white/15 active:scale-95 sm:h-11 sm:w-11"
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
				class="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-95 sm:h-11 sm:w-11"
				title="Compartir enlace"
				aria-label="Compartir enlace"
			>
				<Share2 class="h-4 w-4" />
			</button>

			<!-- Picture-in-Picture -->
			<button
				onclick={togglePip}
				class="flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95 sm:h-11 sm:w-11 {isPip ? 'bg-[var(--brand)]/20 text-[var(--brand)]' : 'text-white/70 hover:bg-white/15 hover:text-white'}"
				title={isPip ? 'Salir de Picture-in-Picture' : 'Picture-in-Picture'}
				aria-label={isPip ? 'Salir de Picture-in-Picture' : 'Picture-in-Picture'}
			>
				<PictureInPicture2 class="h-4 w-4" />
			</button>

			<!-- Fullscreen -->
			<button
				onclick={onToggleFullscreen}
				class="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-95 sm:h-11 sm:w-11"
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
				class="flex h-10 w-10 items-center justify-center rounded-xl font-mono text-xs text-white/50 transition-all hover:bg-white/15 hover:text-white/80 active:scale-95 sm:h-11 sm:w-11"
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
