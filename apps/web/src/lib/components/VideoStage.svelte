<script lang="ts">
	import {
		Monitor,
		Volume2,
		VolumeX,
		Maximize,
		Minimize,
		Circle,
		StopCircle,
		PlayCircle,
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
	// Reading the prop inside $effect is intentional: we want the callback to fire
	// when the element mounts. The parent passes a stable identity in practice.
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
		<!-- Placeholder -->
		<div class="flex h-full w-full flex-col items-center justify-center bg-[var(--surface-2)]">
			<div class="relative mb-5">
				<div class="absolute inset-0 rounded-full opacity-40 blur-2xl gradient-brand"></div>
				<div class="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)]">
					<Monitor class="h-10 w-10 text-[var(--text-subtle)]" />
				</div>
			</div>
			<h3 class="mb-1 font-semibold text-[var(--text)]">Sin transmisión</h3>
			<p class="text-sm text-[var(--text-muted)]">Comparte tu pantalla para comenzar</p>
		</div>
	{/if}

	<!-- Floating controls (visible on hover / focus-within; always present for keyboard) -->
	{#if sharing}
		<div
			class="group absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl p-1.5 transition-opacity duration-300 focus-within:opacity-100 hover:opacity-100 sm:opacity-0"
			style="background: color-mix(in srgb, var(--ink-950) 70%, transparent); backdrop-filter: blur(12px);"
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
					class="flex h-11 items-center gap-1.5 rounded-xl bg-[var(--danger)]/80 px-3 transition-all hover:bg-[var(--danger)] active:scale-95"
					title="Detener grabación"
					aria-label="Detener grabación"
				>
					<span class="h-2.5 w-2.5 rounded-full bg-white" style="animation: pulseRecord 1s ease-in-out infinite;"></span>
					<span class="font-mono text-xs font-medium text-white">{formatDuration(recordingDuration)}</span>
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

			<div class="mx-0.5 h-6 w-px bg-white/15"></div>

			<button
				onclick={onStopSharing}
				class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--danger)]/80 transition-all hover:bg-[var(--danger)] active:scale-95"
				title="Detener compartición"
				aria-label="Detener compartición"
			>
				<StopCircle class="h-5 w-5 text-white" />
			</button>
		</div>
	{/if}
</div>
