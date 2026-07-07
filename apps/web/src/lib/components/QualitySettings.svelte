<script lang="ts">
	import { Volume2, VolumeX, Settings, Check, SlidersHorizontal, Type, Zap } from 'lucide-svelte';

	export interface QualityPreset {
		label: string;
		resolution: { width: number; height: number };
		fps: number;
		bitrate: number;
		desc: string;
	}

	interface Props {
		presets: Record<string, QualityPreset>;
		selected: string;
		includeAudio: boolean;
		autoAdapt: boolean;
		/** 'detail' for text/UI/code, 'motion' for video/gaming. */
		contentHint: 'detail' | 'motion';
		/** Custom resolution height (480/720/1080/1440). */
		customRes: number;
		/** Custom FPS (15/30/60). */
		customFps: number;
		/** Custom bitrate in bps. */
		customBitrate: number;
	}

	let {
		presets,
		selected = $bindable('normal'),
		includeAudio = $bindable(true),
		autoAdapt = $bindable(true),
		contentHint = $bindable('detail'),
		customRes = $bindable(1080),
		customFps = $bindable(30),
		customBitrate = $bindable(2_500_000),
	}: Props = $props();

	// Resolution options for the custom slider.
	const resOptions = [480, 720, 1080, 1440];
	const resLabels: Record<number, string> = { 480: '480p', 720: '720p', 1080: '1080p', 1440: '1440p' };
	const fpsOptions = [15, 30, 60];

	function formatBitrate(bps: number): string {
		if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
		return `${Math.round(bps / 1000)} Kbps`;
	}

	function resIndex(): number {
		return Math.max(0, resOptions.indexOf(customRes));
	}

	function fpsIndex(): number {
		return Math.max(0, fpsOptions.indexOf(customFps));
	}

	function onResSlider(e: Event) {
		const idx = Number((e.target as HTMLInputElement).value);
		customRes = resOptions[idx] ?? 1080;
	}

	function onFpsSlider(e: Event) {
		const idx = Number((e.target as HTMLInputElement).value);
		customFps = fpsOptions[idx] ?? 30;
	}
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
			class="relative h-6 w-10 rounded-full transition-colors duration-200 {includeAudio ? 'gradient-brand' : 'bg-[var(--border)]'}"
			role="switch"
			aria-checked={includeAudio}
			aria-label="Incluir audio"
		>
			<span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 {includeAudio ? 'translate-x-4' : 'translate-x-0'}"></span>
		</button>
	</div>

	<!-- Content hint toggle: text sharpness vs motion -->
	<div class="flex items-center justify-between p-2">
		<div class="flex items-center gap-2">
			{#if contentHint === 'detail'}
				<Type class="h-4 w-4 text-[var(--text-muted)]" />
			{:else}
				<Zap class="h-4 w-4 text-[var(--text-muted)]" />
			{/if}
			<span class="text-sm font-medium text-[var(--text)]">Nitidez de texto</span>
		</div>
		<button
			onclick={() => (contentHint = contentHint === 'detail' ? 'motion' : 'detail')}
			class="relative h-6 w-10 rounded-full transition-colors duration-200 {contentHint === 'detail' ? 'gradient-brand' : 'bg-[var(--border)]'}"
			role="switch"
			aria-checked={contentHint === 'detail'}
			aria-label="Priorizar nitidez de texto"
		>
			<span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 {contentHint === 'detail' ? 'translate-x-4' : 'translate-x-0'}"></span>
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
			class="relative h-6 w-10 rounded-full transition-colors duration-200 {autoAdapt ? 'gradient-brand' : 'bg-[var(--border)]'}"
			role="switch"
			aria-checked={autoAdapt}
			aria-label="Adaptación automática de calidad"
		>
			<span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 {autoAdapt ? 'translate-x-4' : 'translate-x-0'}"></span>
		</button>
	</div>

	<!-- Divider -->
	<div class="my-1 h-px bg-[var(--border)]"></div>

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

	<!-- Custom preset button -->
	<button
		onclick={() => (selected = 'custom')}
		class="flex w-full items-center gap-2 rounded-xl border-2 p-3 text-left transition-all {selected === 'custom'
			? 'border-[var(--brand)] bg-[var(--surface)] shadow-glow'
			: 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-subtle)]'}"
	>
		<SlidersHorizontal class="h-4 w-4 text-[var(--brand)]" />
		<div class="flex-1">
			<span class="text-sm font-semibold text-[var(--text)]">Personalizado</span>
			<p class="text-xs text-[var(--text-muted)]">Ajusta resolución, FPS y bitrate</p>
		</div>
		{#if selected === 'custom'}
			<span class="flex h-4 w-4 items-center justify-center rounded-full gradient-brand">
				<Check class="h-2.5 w-2.5 text-white" />
			</span>
		{/if}
	</button>

	<!-- Custom sliders (only when 'custom' is selected) -->
	{#if selected === 'custom'}
		<div class="space-y-3 rounded-xl bg-[var(--surface)] p-3">
			<!-- Resolution -->
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<label for="q-res" class="text-xs font-medium text-[var(--text-muted)]">Resolución</label>
					<span class="font-mono text-xs font-bold text-[var(--brand)]">{resLabels[customRes] ?? '1080p'}</span>
				</div>
				<input
					id="q-res"
					type="range"
					min="0"
					max={resOptions.length - 1}
					step="1"
					value={resIndex()}
					oninput={onResSlider}
					class="q-slider w-full"
					aria-label="Resolución"
				/>
			</div>

			<!-- FPS -->
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<label for="q-fps" class="text-xs font-medium text-[var(--text-muted)]">FPS</label>
					<span class="font-mono text-xs font-bold text-[var(--brand)]">{customFps} fps</span>
				</div>
				<input
					id="q-fps"
					type="range"
					min="0"
					max={fpsOptions.length - 1}
					step="1"
					value={fpsIndex()}
					oninput={onFpsSlider}
					class="q-slider w-full"
					aria-label="FPS"
				/>
			</div>

			<!-- Bitrate -->
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<label for="q-bitrate" class="text-xs font-medium text-[var(--text-muted)]">Bitrate</label>
					<span class="font-mono text-xs font-bold text-[var(--brand)]">{formatBitrate(customBitrate)}</span>
				</div>
				<input
					id="q-bitrate"
					type="range"
					min="500000"
					max="5000000"
					step="250000"
					bind:value={customBitrate}
					class="q-slider w-full"
					aria-label="Bitrate"
				/>
				<div class="mt-0.5 flex justify-between text-[10px] text-[var(--text-subtle)]">
					<span>0.5 Mbps</span>
					<span>5 Mbps</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	input[type='range'].q-slider {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		border-radius: 2px;
		background: var(--border);
		outline: none;
		cursor: pointer;
	}
	input[type='range'].q-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--brand);
		cursor: pointer;
		box-shadow: 0 0 0 2px var(--surface);
	}
	input[type='range'].q-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--brand);
		border: none;
		cursor: pointer;
		box-shadow: 0 0 0 2px var(--surface);
	}
</style>
