<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import EmotePicker from './EmotePicker.svelte';
	import QualitySettings, { type QualityPreset } from './QualitySettings.svelte';
	import { Copy, Check, Link2, Settings, Share2, StopCircle, Circle, ArrowLeft, Smartphone } from 'lucide-svelte';

	interface Props {
		// Room info
		pin: string;
		roomUrl: string;
		copiedPin: boolean;
		copiedUrl: boolean;
		// Sharing state
		sharing: boolean;
		// Quality
		presets: Record<string, QualityPreset>;
		qualityPreset: string;
		showSettings: boolean;
		includeAudio: boolean;
		autoAdapt: boolean;
		// Recording
		recording: boolean;
		recordingDuration: number;
		// Push
		pushEnabled: boolean;
		// Emotes
		favoriteEmojis: string[];
		showEmotePicker: boolean;
		// Callbacks
		onCopyPin: () => void;
		onCopyUrl: () => void;
		onToggleSettings: () => void;
		onShare: () => void;
		onStop: () => void;
		onStartRecording: () => void;
		onStopRecording: () => void;
		onTogglePush: () => void;
		onSendReaction: (emoji: string) => void;
		onToggleEmotePicker: () => void;
		onCloseEmotePicker: () => void;
		onLeave: () => void;
		// Chat panel slot
		children: Snippet;
	}

	let {
		pin,
		roomUrl,
		copiedPin,
		copiedUrl,
		sharing,
		presets,
		qualityPreset = $bindable(),
		showSettings,
		includeAudio = $bindable(),
		autoAdapt = $bindable(),
		recording,
		recordingDuration,
		pushEnabled,
		favoriteEmojis,
		showEmotePicker,
		onCopyPin,
		onCopyUrl,
		onToggleSettings,
		onShare,
		onStop,
		onStartRecording,
		onStopRecording,
		onTogglePush,
		onSendReaction,
		onToggleEmotePicker,
		onCloseEmotePicker,
		onLeave,
		children,
	}: Props = $props();
</script>

<aside class="flex h-full w-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)] lg:w-80">
	<!-- Room info (fixed height, doesn't shrink) -->
	<div class="shrink-0 space-y-3 border-b border-[var(--border)] p-4">
		<h3 class="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
			Información de sala
		</h3>

		<!-- PIN -->
		<div class="rounded-xl bg-[var(--surface-2)] p-3">
			<div class="mb-1 flex items-center justify-between">
				<span class="text-xs font-medium text-[var(--text-muted)]">PIN de acceso</span>
				<button
					onclick={onCopyPin}
					class="rounded-lg p-1 transition-all hover:bg-[var(--border)] active:scale-95"
					aria-label="Copiar PIN"
				>
					{#if copiedPin}
						<Check class="h-3.5 w-3.5 text-[var(--success)]" />
					{:else}
						<Copy class="h-3.5 w-3.5 text-[var(--text-subtle)]" />
					{/if}
				</button>
			</div>
			<p class="font-mono text-2xl font-bold tracking-[0.2em] text-[var(--text)]">{pin}</p>
		</div>

		<!-- URL -->
		<div class="rounded-xl bg-[var(--surface-2)] p-3">
			<div class="mb-1 flex items-center justify-between">
				<span class="text-xs font-medium text-[var(--text-muted)]">Enlace de sala</span>
				<button
					onclick={onCopyUrl}
					class="rounded-lg p-1 transition-all hover:bg-[var(--border)] active:scale-95"
					aria-label="Copiar enlace"
				>
					{#if copiedUrl}
						<Check class="h-3.5 w-3.5 text-[var(--success)]" />
					{:else}
						<Link2 class="h-3.5 w-3.5 text-[var(--text-subtle)]" />
					{/if}
				</button>
			</div>
			<p class="truncate font-mono text-xs text-[var(--text-muted)]">{roomUrl}</p>
		</div>
	</div>

	<!-- Actions (fixed height, doesn't shrink) -->
	<div class="shrink-0 space-y-2 border-b border-[var(--border)] p-4">
		{#if !sharing}
			<button
				onclick={onToggleSettings}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--border)] active:scale-95"
			>
				<Settings class="h-4 w-4" />
				Configurar calidad
				<span class="ml-auto text-xs text-[var(--text-subtle)]">{presets[qualityPreset].label}</span>
			</button>

			{#if showSettings}
				<QualitySettings
					{presets}
					bind:selected={qualityPreset}
					bind:includeAudio
					bind:autoAdapt
				/>
			{/if}

			<Button onclick={onShare} class="w-full">
				<Share2 class="h-4 w-4" />
				Compartir pantalla
			</Button>
		{:else}
			<Button variant="danger" onclick={onStop} class="w-full">
				<StopCircle class="h-4 w-4" />
				Detener transmisión
			</Button>
		{/if}

		<!-- Recording -->
		{#if sharing}
			{#if recording}
				<Button variant="danger" onclick={onStopRecording} class="w-full">
					<Circle class="h-4 w-4" />
					<span class="mr-auto h-2 w-2 rounded-full bg-white" style="animation: pulseRecord 1s ease-in-out infinite;"></span>
					Detener grabación
					<span class="font-mono text-xs opacity-80">{recordingDuration}s</span>
				</Button>
			{:else}
				<Button variant="secondary" onclick={onStartRecording} class="w-full">
					<Circle class="h-4 w-4 text-[var(--danger)]" />
					Grabar sesión
				</Button>
			{/if}

			<!-- Push notifications -->
			<button
				onclick={onTogglePush}
				class="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95 {pushEnabled ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)]'}"
			>
				<Smartphone class="h-4 w-4" />
				{pushEnabled ? 'Notificaciones push activas' : 'Activar notificaciones push'}
			</button>

			<!-- Emotes -->
			<EmotePicker
				favorites={favoriteEmojis}
				open={showEmotePicker}
				onSend={onSendReaction}
				onToggle={onToggleEmotePicker}
				onClose={onCloseEmotePicker}
			/>
		{/if}

		<Button variant="ghost" onclick={onLeave} class="w-full">
			<ArrowLeft class="h-4 w-4" />
			Cerrar sala
		</Button>
	</div>

	<!-- Chat panel (rendered by parent via children snippet) -->
	{@render children()}
</aside>
