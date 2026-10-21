<script lang="ts">
	import { Volume2, Volume1, VolumeX, Maximize, Minimize, Share2, PictureInPicture2, Gauge, WifiOff } from 'lucide-svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { clickOutside } from '$lib/actions';
	import type { FloatingReaction } from '$lib/types/room';

	export type QualityMode = 'auto' | 'high' | 'medium' | 'low';

	interface Props {
		muted: boolean;
		volume: number;
		fullscreen: boolean;
		hostMuted: boolean;
		assignedUsername: string;
		reactions: FloatingReaction[];
		/** Layered (simulcast/SVC) producer — enables the quality selector. */
		layered: boolean;
		qualityMode: QualityMode;
		/** e.g. "Media" — the layer the SFU is actually sending, null unknown. */
		activeLayerLabel: string | null;
		/** Last decoded frame (JPEG dataURL) kept on screen while reconnecting. */
		frozenFrame: string | null;
		reconnecting: boolean;
		onVideoMount: (el: HTMLVideoElement) => void;
		onContainerMount: (el: HTMLDivElement) => void;
		onToggleMute: () => void;
		onVolumeChange: (v: number) => void;
		onToggleFullscreen: () => void;
		onShare: () => void;
		onShowShortcuts: () => void;
		onVideoClick: () => void;
		onQualityChange: (mode: QualityMode) => void;
	}

	let {
		muted,
		volume,
		fullscreen,
		hostMuted,
		assignedUsername,
		reactions,
		layered = false,
		qualityMode = 'auto',
		activeLayerLabel = null,
		frozenFrame = null,
		reconnecting = false,
		onVideoMount,
		onContainerMount,
		onToggleMute,
		onVolumeChange,
		onToggleFullscreen,
		onShare,
		onShowShortcuts,
		onVideoClick,
		onQualityChange,
	}: Props = $props();

	const QUALITY_OPTIONS: Array<{ id: QualityMode; label: string }> = [
		{ id: 'auto', label: t('vroom.qualityAuto') },
		{ id: 'high', label: t('vroom.qualityHigh') },
		{ id: 'medium', label: t('vroom.qualityMedium') },
		{ id: 'low', label: t('vroom.qualityLow') },
	];

	let showQuality = $state(false);

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
	aria-label={t('vroom.liveVideo')}
>
	<video
		bind:this={videoEl}
		autoplay
		muted
		playsinline
		onclick={onVideoClick}
		use:pipEvents
		class="h-full w-full cursor-pointer object-contain"
		title={t('vroom.clickToUnmute')}
	></video>

	<!-- Frozen last frame: while the viewer's connection is down the <video>
	     would go black (its stream is torn down) — keep the last decoded
	     frame on screen with an honest "reconnecting" pill instead. -->
	{#if frozenFrame}
		<img
			src={frozenFrame}
			alt=""
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 h-full w-full object-contain"
		/>
		{#if reconnecting}
			<div class="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4">
				<span class="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm">
					<WifiOff class="h-3.5 w-3.5 animate-pulse" />
					{t('vroom.frozenReconnecting')}
				</span>
			</div>
		{/if}
	{/if}

	<!-- Top-left overlays -->
	<div class="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2">
		<!-- LIVE badge: custom, matches HostHeader style -->
		<span class="flex items-center gap-1.5 rounded-full bg-[var(--danger)]/90 px-2.5 py-1 text-xs font-bold text-white max-md:backdrop-blur-none md:backdrop-blur-sm">
			<span class="relative flex h-1.5 w-1.5">
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
				<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
			</span>
			{t('comp.liveBadge')}
		</span>
		{#if hostMuted}
			<span class="flex items-center gap-1 rounded-full bg-[var(--warning)]/90 px-2 py-1 text-xs font-medium text-white max-md:backdrop-blur-none md:backdrop-blur-sm">
				<VolumeX class="h-3 w-3" />
				{t('vroom.hostMutedBadge')}
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
		class="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-4 pt-10 opacity-100 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 sm:opacity-0"
	>
		<div class="pointer-events-auto mx-auto flex max-w-2xl items-center gap-2">
			<!-- Mute -->
			<button
				onclick={onToggleMute}
				class="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-all hover:bg-white/15 active:scale-95"
				title={muted ? t('room.unmuteSound') : t('room.muteSound')}
				aria-label={muted ? t('room.unmuteSound') : t('room.muteSound')}
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
					title={t('vroom.volume', { volume })}
					aria-label={t('vroom.volumeLabel')}
				/>
				<span class="w-8 text-right font-mono text-[10px] text-white/60">{volume}%</span>
			</div>

			<div class="flex-1"></div>

			<!-- Quality selector (layered producers only): preferred layer cap
			     + the layer the SFU is actually sending right now. -->
			{#if layered}
				<div class="relative" use:clickOutside={() => (showQuality = false)}>
					<button
						onclick={() => (showQuality = !showQuality)}
						class="flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95 {showQuality ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/15 hover:text-white'}"
						title={t('vroom.quality')}
						aria-label={t('vroom.quality')}
						aria-haspopup="menu"
						aria-expanded={showQuality}
					>
						<Gauge class="h-4 w-4" />
					</button>
					{#if showQuality}
						<div
							role="menu"
							aria-label={t('vroom.quality')}
							class="absolute bottom-14 right-0 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-[var(--surface)]/95 p-1 shadow-2xl backdrop-blur-md"
						>
							{#each QUALITY_OPTIONS as opt (opt.id)}
								<button
									role="menuitemradio"
									aria-checked={qualityMode === opt.id}
									onclick={() => { onQualityChange(opt.id); showQuality = false; }}
									class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 {qualityMode === opt.id ? 'font-semibold text-[var(--brand)]' : 'text-[var(--text)]'}"
								>
									{opt.label}
									{#if qualityMode === opt.id}
										<span class="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden="true"></span>
									{/if}
								</button>
							{/each}
							<div class="mt-1 border-t border-white/10 px-3 py-2 text-[11px] leading-snug text-[var(--text-subtle)]">
								{#if activeLayerLabel}
									{t('vroom.qualityActive', { layer: activeLayerLabel })}
								{:else}
									{t('vroom.qualityActiveUnknown')}
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Share -->
			<button
				onclick={onShare}
				class="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-95"
				title={t('vroom.shareLink')}
				aria-label={t('vroom.shareLink')}
			>
				<Share2 class="h-4 w-4" />
			</button>

			<!-- Picture-in-Picture -->
			<button
				onclick={togglePip}
				class="flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95 {isPip ? 'bg-[var(--brand)]/20 text-[var(--brand)]' : 'text-white/70 hover:bg-white/15 hover:text-white'}"
				title={isPip ? t('vroom.exitPip') : t('vroom.pip')}
				aria-label={isPip ? t('vroom.exitPip') : t('vroom.pip')}
			>
				<PictureInPicture2 class="h-4 w-4" />
			</button>

			<!-- Fullscreen -->
			<button
				onclick={onToggleFullscreen}
				class="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-95"
				title={fullscreen ? t('room.exitFullscreen') : t('room.fullscreen')}
				aria-label={fullscreen ? t('room.exitFullscreen') : t('room.fullscreen')}
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
				class="flex h-11 w-11 items-center justify-center rounded-xl font-mono text-xs text-white/50 transition-all hover:bg-white/15 hover:text-white/80 active:scale-95"
				title={t('vroom.shortcuts')}
				aria-label={t('vroom.shortcuts')}
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
