<script lang="ts">
	import {
		Monitor,
		Volume2,
		VolumeX,
		Maximize,
		Minimize,
		Circle,
		StopCircle,
		Radio,
	} from 'lucide-svelte';
	import { formatDuration } from '$lib/utils/format';

	interface Props {
		/** Whether a stream is being shared. */
		sharing: boolean;
		/** Whether audio is muted. */
		muted: boolean;
		/** Whether fullscreen is active. */
		fullscreen: boolean;
		/** Whether currently recording. */
		recording: boolean;
		/** Recording duration in seconds. */
		recordingDuration: number;
		/** Expose the <video> element to the parent (for srcObject binding). */
		onVideoMount: (el: HTMLVideoElement) => void;
		/** Expose the container (for fullscreen targeting). */
		onContainerMount: (el: HTMLDivElement) => void;
		onToggleMute: () => void;
		onToggleFullscreen: () => void;
		onStartRecording: () => void;
		onStopRecording: () => void;
		onStopSharing: () => void;
	}

	let {
		sharing,
		muted,
		fullscreen,
		recording,
		recordingDuration,
		onVideoMount,
		onContainerMount,
		onToggleMute,
		onToggleFullscreen,
		onStartRecording,
		onStopRecording,
		onStopSharing,
	}: Props = $props();

	let videoEl: HTMLVideoElement | null = $state(null);
	let containerEl: HTMLDivElement | null = $state(null);

	// Propagate element refs up to the parent (for srcObject + fullscreen).
	$effect(() => {
		const el = videoEl;
		if (el) onVideoMount(el);
	});
	$effect(() => {
		const el = containerEl;
		if (el) onContainerMount(el);
	});
</script>

<div bind:this={containerEl} class="relative h-full w-full" id="video-container">
	{#if sharing}
		<video
			autoplay
			playsinline
			muted
			bind:this={videoEl}
			class="h-full w-full bg-black object-contain"
		></video>
	{:else}
		<!-- Idle placeholder: protagonista, guía al host a compartir -->
		<div class="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[var(--surface-2)]">
			<!-- Subtle grid background (matches landing language) -->
			<div
				class="pointer-events-none absolute inset-0 opacity-[0.12]"
				style="background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse at center, black, transparent 70%);"
			></div>

			<!-- Glow + icon -->
			<div class="relative mb-7">
				<div class="absolute inset-0 rounded-full opacity-50 blur-3xl gradient-brand"></div>
				<div class="relative flex h-24 w-24 animate-float items-center justify-center rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-glow">
					<Monitor class="h-12 w-12 text-[var(--brand)]" />
				</div>
			</div>

			<!-- Heading -->
			<h3 class="mb-2 text-2xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">
				Listo para compartir
			</h3>
			<p class="mb-6 max-w-xs text-center text-sm text-[var(--text-muted)]">
				Pulsa el botón para mostrar tu pantalla a tus espectadores
			</p>

			<!-- Waiting indicator -->
			<div class="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand)]"></span>
				</span>
				<span class="text-xs font-medium text-[var(--text-subtle)]">Esperando para transmitir</span>
			</div>
		</div>
	{/if}

	<!-- Floating controls: glass bar, hover-reveal on desktop, always visible on mobile -->
	{#if sharing}
		<div
			class="group absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 p-1.5 transition-all duration-300 focus-within:opacity-100 hover:opacity-100 sm:opacity-0 sm:hover:-translate-y-0.5"
			style="background: color-mix(in srgb, var(--ink-950) 80%, transparent); backdrop-filter: blur(16px) saturate(140%);"
		>
			<button
				onclick={onToggleMute}
				class="flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:bg-white/15 active:scale-95"
				title={muted ? 'Activar audio' : 'Silenciar audio'}
				aria-label={muted ? 'Activar audio' : 'Silenciar audio'}
			>
				{#if muted}
					<VolumeX class="h-5 w-5 text-[var(--danger)]" />
				{:else}
					<Volume2 class="h-5 w-5 text-white" />
				{/if}
			</button>

			<button
				onclick={onToggleFullscreen}
				class="flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:bg-white/15 active:scale-95"
				title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
				aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
			>
				{#if fullscreen}
					<Minimize class="h-5 w-5 text-white" />
				{:else}
					<Maximize class="h-5 w-5 text-white" />
				{/if}
			</button>

			{#if recording}
				<button
					onclick={onStopRecording}
					class="flex h-10 items-center gap-2 rounded-xl bg-[var(--danger)]/90 px-3 transition-all hover:bg-[var(--danger)] active:scale-95 sm:h-11"
					title="Detener grabación"
					aria-label="Detener grabación"
				>
					<span class="h-2.5 w-2.5 rounded-full bg-white" style="animation: pulseRecord 1s ease-in-out infinite;"></span>
					<span class="font-mono text-xs font-semibold text-white">{formatDuration(recordingDuration)}</span>
				</button>
			{:else}
				<button
					onclick={onStartRecording}
					class="flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:bg-white/15 active:scale-95"
					title="Grabar sesión"
					aria-label="Grabar sesión"
				>
					<Circle class="h-5 w-5 text-[var(--danger)]" />
				</button>
			{/if}

			<div class="mx-0.5 h-6 w-px bg-white/10"></div>

			<button
				onclick={onStopSharing}
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--danger)]/90 transition-all hover:bg-[var(--danger)] active:scale-95 sm:h-11 sm:w-11"
				title="Detener compartición"
				aria-label="Detener compartición"
			>
				<StopCircle class="h-5 w-5 text-white" />
			</button>
		</div>
	{/if}
</div>
