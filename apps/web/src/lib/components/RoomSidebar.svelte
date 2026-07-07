<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import EmotePicker from './EmotePicker.svelte';
	import QualitySettings, { type QualityPreset } from './QualitySettings.svelte';
	import { Check, Link2, Settings, Share2, StopCircle, ArrowLeft, ChevronDown } from 'lucide-svelte';

	interface Props {
		// Room info
		pin: string;
		roomUrl: string;
		copiedInvite: boolean;
		// Sharing state
		sharing: boolean;
		// Quality
		presets: Record<string, QualityPreset>;
		qualityPreset: string;
		showSettings: boolean;
		includeAudio: boolean;
		autoAdapt: boolean;
		contentHint: 'detail' | 'motion';
		customRes: number;
		customFps: number;
		customBitrate: number;
		// Recording (kept for prop compat, but controls live in VideoStage now)
		recording: boolean;
		recordingDuration: number;
		// Emotes
		favoriteEmojis: string[];
		showEmotePicker: boolean;
		// Callbacks
		onCopyInvite: () => void;
		onToggleSettings: () => void;
		onShare: () => void;
		onStop: () => void;
		onStartRecording: () => void;
		onStopRecording: () => void;
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
		copiedInvite,
		sharing,
		presets,
		qualityPreset = $bindable(),
		showSettings,
		includeAudio = $bindable(),
		autoAdapt = $bindable(),
		contentHint = $bindable(),
		customRes = $bindable(),
		customFps = $bindable(),
		customBitrate = $bindable(),
		recording,
		recordingDuration,
		favoriteEmojis,
		showEmotePicker,
		onCopyInvite,
		onToggleSettings,
		onShare,
		onStop,
		onStartRecording,
		onStopRecording,
		onSendReaction,
		onToggleEmotePicker,
		onCloseEmotePicker,
		onLeave,
		children,
	}: Props = $props();
</script>

<aside class="flex h-full w-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)] lg:w-80">
	<!-- ── Room info: PIN protagonista + URL compacta ── -->
	<div class="shrink-0 space-y-2.5 border-b border-[var(--border)] p-4">
		<!-- PIN: prominent card with brand glow (display only) -->
		<div class="relative overflow-hidden rounded-xl border border-[var(--brand)]/20 bg-[var(--surface-2)] p-3.5">
			<div class="absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-20 blur-2xl gradient-brand"></div>
			<span class="relative text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">PIN de acceso</span>
			<p class="relative font-mono text-3xl font-bold tracking-[0.25em] text-[var(--brand)]">{pin}</p>
		</div>

		<!-- Single copy invitation button (URL + PIN embedded) -->
		<button
			onclick={onCopyInvite}
			class="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2.5 text-xs font-medium text-[var(--text)] transition-all hover:bg-[var(--border)] active:scale-95"
		>
			{#if copiedInvite}
				<Check class="h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
				<span class="text-[var(--success)]">¡Invitación copiada!</span>
			{:else}
				<Link2 class="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
				<span>Copiar invitación</span>
				<span class="ml-auto text-[10px] text-[var(--text-subtle)]">incluye PIN</span>
			{/if}
		</button>
	</div>

	<!-- ── Actions: compartir/detener + calidad + emotes ── -->
	<div class="shrink-0 space-y-2 border-b border-[var(--border)] p-4">
		{#if !sharing}
			<!-- Quality settings: collapsible, compact -->
			<button
				onclick={onToggleSettings}
				class="flex w-full items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--border)] active:scale-95"
			>
				<Settings class="h-3.5 w-3.5" />
				Calidad
				<span class="ml-auto text-[var(--text-subtle)]">{qualityPreset === 'custom' ? 'Personalizado' : presets[qualityPreset]?.label ?? '—'}</span>
				<ChevronDown class={`h-3.5 w-3.5 text-[var(--text-subtle)] transition-transform ${showSettings ? 'rotate-180' : ''}`} />
			</button>

			{#if showSettings}
				<QualitySettings
					{presets}
					bind:selected={qualityPreset}
					bind:includeAudio
					bind:autoAdapt
					bind:contentHint
					bind:customRes
					bind:customFps
					bind:customBitrate
				/>
			{/if}

			<!-- Compartir: protagonista -->
			<button
				onclick={onShare}
				class="gradient-brand flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-black shadow-glow transition-all hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
			>
				<Share2 class="h-4 w-4" />
				Compartir pantalla
			</button>
		{:else}
			<Button variant="danger" onclick={onStop} class="w-full" size="lg">
				<StopCircle class="h-4 w-4" />
				Detener transmisión
			</Button>

			<!-- Emotes (only when sharing) -->
			<div class="pt-1">
				<EmotePicker
					favorites={favoriteEmojis}
					open={showEmotePicker}
					onSend={onSendReaction}
					onToggle={onToggleEmotePicker}
					onClose={onCloseEmotePicker}
				/>
			</div>
		{/if}

		<Button variant="ghost" onclick={onLeave} size="sm" class="w-full !text-[var(--text-subtle)]">
			<ArrowLeft class="h-3.5 w-3.5" />
			Cerrar sala
		</Button>
	</div>

	<!-- ── Chat panel (fills remaining space) ── -->
	{@render children()}
</aside>
