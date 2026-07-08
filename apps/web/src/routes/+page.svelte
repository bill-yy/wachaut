<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		ArrowRight,
		Radio,
		ChevronRight,
		Zap,
		Globe,
		Shield,
		Monitor,
		Users,
		Share2,
	} from 'lucide-svelte';
	import Brand from '$lib/components/Brand.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Card from '$lib/components/Card.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';
	import ScreenMockup from '$lib/components/ScreenMockup.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let isCreating = $state(false);
	let showOnboarding = $state(false);
	let onboardingStep = $state(0);
	let serviceOnline = $state(true);

	async function checkServiceStatus() {
		try {
			const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
			const httpUrl = wsUrl.replace(/^ws/, 'http').replace(/\?.*$/, '');
			const res = await fetch(`${httpUrl}/health`, { signal: AbortSignal.timeout(3000) });
			serviceOnline = res.ok;
		} catch {
			serviceOnline = false;
		}
	}

	onMount(() => {
		checkServiceStatus();
		const healthInterval = setInterval(checkServiceStatus, 60000);
		if (!localStorage.getItem('wachaut-onboarded')) {
			// Slight delay so the hero entrance animation finishes first.
			const t = setTimeout(() => (showOnboarding = true), 600);
			return () => { clearTimeout(t); clearInterval(healthInterval); };
		}
	});

	function completeOnboarding() {
		localStorage.setItem('wachaut-onboarded', 'true');
		showOnboarding = false;
		onboardingStep = 0;
	}

	async function shareScreen() {
		isCreating = true;
		try {
			await goto('/room');
		} catch {
			window.location.href = '/room';
		}
	}

	let joinUrl = $state('');

	function handleJoin() {
		const url = joinUrl.trim();
		if (!url) {
			toast.error('Pega un enlace para entrar.');
			return;
		}
		try {
			const urlObj = new URL(url);
			// Preserve hash + search so the PIN embedded in # arrives at the viewer page.
			goto(urlObj.pathname + urlObj.search + urlObj.hash);
		} catch {
			// Not a full URL — treat as a path or room ID.
			goto(url.startsWith('/') ? url : `/room/${url}`);
		}
	}

	const onboardingSteps = [
		{
			icon: Monitor,
			title: 'Comparte tu pantalla',
			description: 'Pulsa "Compartir mi pantalla" y elige qué quieres mostrar.',
		},
		{
			icon: Share2,
			title: 'Comparte el enlace',
			description: 'Copia el enlace de invitación y envíaselo a quien quieras que te vea. El PIN va incluido.',
		},
		{
			icon: Users,
			title: '¡Listo!',
			description: 'Tus amigos abren el enlace y ven tu pantalla en tiempo real, sin escribir nada.',
		},
	];

	const features = [
		{
			icon: Zap,
			title: 'Sin registro',
			body: 'Entra y comparte en segundos. Sin cuentas, sin contraseñas.',
		},
		{
			icon: Globe,
			title: 'Desde el navegador',
			body: 'No instalas nada. Funciona en Chrome, Firefox, Edge y Safari.',
		},
		{
			icon: Shield,
			title: 'Privado y seguro',
			body: 'Conexión cifrada (DTLS-SRTP). Tus salas se cierran al terminar y no guardamos tu contenido.',
		},
	];

	// Current onboarding step icon (derived so it tracks step changes).
	const StepIcon = $derived(onboardingSteps[onboardingStep].icon);
</script>

<svelte:head>
	<title>Wachaut — Comparte tu pantalla al instante</title>
	<meta
		name="description"
		content="Comparte tu pantalla con amigos sin registro. Crea una sala, comparte el enlace y listo. Audio incluido. Chrome, Firefox, Edge y Safari."
	/>
</svelte:head>

<div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
	<!-- Animated ambient background: aurora + particle constellation + shooting stars. -->
	<div class="aurora-bg absolute inset-0"></div>
	<ParticleField />
	<div
		class="absolute inset-0 opacity-[0.12]"
		style="background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 64px 64px; mask-image: radial-gradient(ellipse at center, black, transparent 70%);"
	></div>
	<div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg)]"></div>
	<div
		class="absolute inset-0 opacity-[0.03]"
		style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"
	></div>
</div>

<div class="relative z-10 flex min-h-screen flex-col overflow-hidden">
	<!-- Nav -->
	<nav class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
		<Brand size="md" />
		{#if serviceOnline}
			<Pill tone="success" pulse><span class="hidden sm:inline">Servicio activo</span><span class="sm:hidden">Activo</span></Pill>
		{:else}
			<Pill tone="danger"><span class="hidden sm:inline">Servicio no disponible</span><span class="sm:hidden">Caído</span></Pill>
		{/if}
	</nav>

	<!-- Hero -->
	<main class="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 lg:flex-row lg:items-center lg:gap-16 lg:text-left">
		<div class="stagger flex flex-col items-center lg:items-start lg:flex-1">
			<!-- Announcement pill -->
			<div style="animation-delay: 0ms">
				<span
					class="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-4 py-1.5 text-xs font-medium text-[var(--brand)]"
				>
					<Radio class="h-3.5 w-3.5" />
					Conexión en tiempo real · hasta 20 espectadores
				</span>
			</div>

			<!-- Headline -->
			<h1
				class="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--text)] sm:text-6xl lg:text-7xl"
				style="font-family: var(--font-display); animation-delay: 60ms"
			>
				Comparte tu pantalla
				<span class="text-gradient block">al instante.</span>
			</h1>

			<p class="mt-5 max-w-xl text-lg text-[var(--text-muted)]" style="animation-delay: 120ms">
				Sin registro, sin descargas, sin complicaciones. Un enlace y tu pantalla, en el aire.
			</p>

			<!-- CTAs -->
			<div class="mt-9 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start" style="animation-delay: 200ms">
				<div class="relative">
					<Button onclick={shareScreen} loading={isCreating} size="lg" class="w-full sm:w-auto">
						{#if !isCreating}
							<Radio class="h-5 w-5" />
						{/if}
						{isCreating ? 'Preparando…' : 'Compartir mi pantalla'}
						{#if !isCreating}
							<ChevronRight class="h-4 w-4 opacity-70" />
						{/if}
					</Button>
					<span
						class="absolute -right-2 -top-2 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-bold text-black shadow-glow"
					>
						Gratis
					</span>
				</div>
				<button
					onclick={() => (showOnboarding = true)}
					class="text-sm font-medium text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]"
				>
					¿Cómo funciona?
				</button>
			</div>
		</div>

		<!-- Mockup -->
		<div class="mt-14 w-full max-w-md lg:mt-0 lg:max-w-lg lg:flex-1" style="animation-delay: 240ms">
			<ScreenMockup />
		</div>
	</main>

	<!-- Join section -->
	<section id="join" class="mx-auto w-full max-w-5xl px-4 py-12">
		<Card glass class="max-w-2xl mx-auto">
			<div class="mb-4 flex items-center gap-3">
				<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)]/15 text-[var(--brand)]">
					<Users class="h-4 w-4" />
				</span>
				<div>
					<p class="text-sm font-semibold text-[var(--text)]">¿Eres espectador?</p>
					<p class="text-xs text-[var(--text-subtle)]">Pega el enlace que te compartió el anfitrión</p>
				</div>
			</div>
			<div class="flex gap-2">
				<div class="flex-1">
					<Input
						type="text"
						placeholder="https://wachaut.billytech.es/room/…"
						bind:value={joinUrl}
						onkeydown={(e) => {
							if (e.key === 'Enter') handleJoin();
						}}
					/>
				</div>
				<Button onclick={handleJoin} aria-label="Entrar en la sala" class="px-5">
					<ArrowRight class="h-5 w-5" />
				</Button>
			</div>
		</Card>
	</section>

	<!-- Features -->
	<section class="mx-auto w-full max-w-5xl px-4 py-16">
		<div class="grid gap-5 sm:grid-cols-3">
			{#each features as f, i}
				{@const FeatureIcon = f.icon}
				<Card interactive glass class="stagger" style={`animation-delay: ${i * 80}ms`}>
					<span class="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/12 text-[var(--brand)]">
						<FeatureIcon class="h-5 w-5" />
					</span>
					<h3 class="mb-2 text-base font-bold text-[var(--text)]">{f.title}</h3>
					<p class="text-sm leading-relaxed text-[var(--text-muted)]">{f.body}</p>
				</Card>
			{/each}
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-[var(--border)] px-4 py-8 text-center">
		<div class="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
			<Brand size="sm" />
			<div class="flex items-center gap-4">
				<p class="text-xs text-[var(--text-subtle)]">Comparte tu pantalla con amigos · {new Date().getFullYear()}</p>
				<a href="/privacidad" class="text-xs text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]">Privacidad</a>
			</div>
		</div>
	</footer>
</div>

<!-- Onboarding -->
<Modal open={showOnboarding} label="Bienvenida a Wachaut" size="sm" onClose={completeOnboarding}>
	<div class="text-center">
		<!-- Step dots -->
			<div class="mb-6 flex justify-center gap-2">
				{#each onboardingSteps as _, i}
					<button
						class="h-2 rounded-full transition-all duration-300 {i === onboardingStep
							? 'w-8 gradient-brand'
							: 'w-2 bg-[var(--border)]'}"
						aria-label={`Paso ${i + 1} de ${onboardingSteps.length}${i === onboardingStep ? ' (actual)' : ''}`}
						aria-current={i === onboardingStep ? 'step' : undefined}
						onclick={() => (onboardingStep = i)}
					></button>
				{/each}
			</div>

		<div class="mb-5 flex justify-center">
			<span class="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--brand)]/12 text-[var(--brand)] transition-all duration-300">
				<StepIcon class="h-10 w-10" />
			</span>
		</div>

		<h2 class="mb-3 text-2xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">
			{onboardingSteps[onboardingStep].title}
		</h2>
		<p class="mb-8 text-sm leading-relaxed text-[var(--text-muted)]">
			{onboardingSteps[onboardingStep].description}
		</p>

		<div class="flex flex-col gap-3">
			{#if onboardingStep < onboardingSteps.length - 1}
				<Button onclick={() => onboardingStep++} class="w-full">
					Siguiente
					<ChevronRight class="h-4 w-4" />
				</Button>
			{:else}
				<Button onclick={completeOnboarding} class="w-full">Entendido</Button>
			{/if}
			<Button variant="ghost" onclick={completeOnboarding} class="w-full">Saltar</Button>
		</div>
	</div>
</Modal>
