<script lang="ts">
	import { Volume2, VolumeX, Settings, Check } from 'lucide-svelte';

	export interface QualityPreset {
		label: string;
		resolution: { width: number; height: number };
		fps: number;
		bitrate: number;
		desc: string;
	}

	interface Props {
		/** Map of preset key -> preset config. */
		presets: Record<string, QualityPreset>;
		/** Currently selected preset key. */
		selected: string;
		/** Include audio in the screen share. */
		includeAudio: boolean;
		/** Auto quality adaptation enabled. */
		autoAdapt: boolean;
	}

	let {
		presets,
		selected = $bindable('normal'),
		includeAudio = $bindable(true),
		autoAdapt = $bindable(true),
	}: Props = $props();
</script>

<div class="space-y-2 rounded-xl bg-[var(--surface-2)] p-3">
	<!-- Audio toggle -->
	<div class="flex items-center justify-between p-2">
		<div class="flex items-center gap-2">
			{#if includeAudio}
				<Volume2 class="h-4 w-4 text-[var(--text-muted)]" />
			{:else}
				<VolumeX class="h-4 w-4 text-[var(--text-subtle)]" />
			{/if}
			<span class="text-sm font-medium text-[var(--text)]">Incluir audio</span>
		</div>
		<button
			onclick={() => (includeAudio = !includeAudio)}
			class="relative h-6 w-10 rounded-full transition-colors duration-200 {includeAudio
				? 'gradient-brand'
				: 'bg-[var(--border)]'}"
			role="switch"
			aria-checked={includeAudio}
			aria-label="Incluir audio"
		>
			<span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 {includeAudio ? 'translate-x-4' : 'translate-x-0'}"></span>
		</button>
	</div>

	<!-- Auto-adapt toggle -->
	<div class="flex items-center justify-between p-2">
		<div class="flex items-center gap-2">
			<Settings class="h-4 w-4 text-[var(--text-muted)]" />
			<span class="text-sm font-medium text-[var(--text)]">Adaptación automática</span>
		</div>
		<button
			onclick={() => (autoAdapt = !autoAdapt)}
			class="relative h-6 w-10 rounded-full transition-colors duration-200 {autoAdapt
				? 'gradient-brand'
				: 'bg-[var(--border)]'}"
			role="switch"
			aria-checked={autoAdapt}
			aria-label="Adaptación automática de calidad"
		>
			<span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 {autoAdapt ? 'translate-x-4' : 'translate-x-0'}"></span>
		</button>
	</div>

	<!-- Presets -->
	{#each Object.entries(presets) as [key, preset] (key)}
		<button
			onclick={() => (selected = key)}
			class="w-full rounded-xl border-2 p-3 text-left transition-all {selected === key
				? 'border-[var(--brand)] bg-[var(--surface)] shadow-glow'
				: 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-subtle)]'}"
		>
			<div class="mb-1 flex items-center justify-between">
				<span class="text-sm font-semibold text-[var(--text)]">{preset.label}</span>
				{#if selected === key}
					<span class="flex h-4 w-4 items-center justify-center rounded-full gradient-brand">
						<Check class="h-2.5 w-2.5 text-white" />
					</span>
				{/if}
			</div>
			<p class="mb-1.5 text-xs text-[var(--text-muted)]">{preset.desc}</p>
			<div class="flex items-center gap-2 font-mono text-[10px] text-[var(--text-subtle)]">
				<span>{preset.resolution.width}×{preset.resolution.height}</span>
				<span>·</span>
				<span>{preset.fps} FPS</span>
				<span>·</span>
				<span>{(preset.bitrate / 1_000_000).toFixed(1)} Mbps</span>
			</div>
		</button>
	{/each}
</div>
