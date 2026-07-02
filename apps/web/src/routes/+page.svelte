<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		ArrowRight,
		Link2,
		Radio,
		ChevronRight,
		Zap,
		Globe,
		Shield,
		Monitor,
		Users,
	} from 'lucide-svelte';
	import Brand from '$lib/components/Brand.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Card from '$lib/components/Card.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let isCreating = $state(false);
	let showOnboarding = $state(false);
	let onboardingStep = $state(0);

	onMount(() => {
		if (!localStorage.getItem('wachaut-onboarded')) {
			// Slight delay so the hero entrance animation finishes first.
			const t = setTimeout(() => (showOnboarding = true), 600);
			return () => clearTimeout(t);
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
			goto(urlObj.pathname);
		} catch {
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
			icon: Link2,
			title: 'Comparte el enlace',
			description: 'Copia el enlace y el PIN y envíaselos a quien quieras que te vea.',
		},
		{
			icon: Users,
			title: '¡Listo!',
			description: 'Tus amigos entran con el PIN y ven tu pantalla en tiempo real.',
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

<div class="relative flex min-h-screen flex-col overflow-hidden bg-app">
	<!-- Ambient background: aurora glows + subtle grid. -->
	<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<div
			class="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
			style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"
		></div>
		<div
			class="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full opacity-25 blur-[120px]"
			style="background: radial-gradient(circle, var(--color-amber-300), transparent 70%);"
		></div>
		<div
			class="absolute inset-0 opacity-[0.18]"
			style="background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 56px 56px; mask-image: radial-gradient(ellipse at center, black, transparent 75%);"
		></div>
	</div>

	<!-- Nav -->
	<nav class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
		<Brand size="md" />
		<Pill tone="success" pulse><span class="hidden sm:inline">Servicio activo</span><span class="sm:hidden">Activo</span></Pill>
	</nav>

	<!-- Hero -->
	<main class="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
		<div class="stagger flex flex-col items-center">
			<!-- Announcement pill -->
			<div style="animation-delay: 0ms">
				<span
					class="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-4 py-1.5 text-xs font-medium text-[var(--brand)]"
				>
					<Radio class="h-3.5 w-3.5" />
					Conexión en tiempo real · hasta 5 espectadores
				</span>
			</div>

			<!-- Headline -->
			<h1
				class="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight text-[var(--text)] sm:text-7xl"
				style="font-family: var(--font-display); animation-delay: 60ms"
			>
				Comparte tu pantalla
				<span class="text-gradient block sm:inline">al instante.</span>
			</h1>

			<p class="mt-5 max-w-xl text-lg text-[var(--text-muted)]" style="animation-delay: 120ms">
				Sin registro, sin descargas, sin complicaciones. Un enlace y tu pantalla, en el aire.
			</p>

			<p class="mt-1 text-sm text-[var(--text-subtle)]" style="animation-delay: 160ms">
				Audio incluido · Chrome, Firefox, Edge y Safari
			</p>

			<!-- CTAs -->
			<div class="mt-9 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center" style="animation-delay: 200ms">
				<Button onclick={shareScreen} loading={isCreating} size="lg" class="w-full sm:w-auto">
					{#if !isCreating}
						<Radio class="h-5 w-5" />
					{/if}
					{isCreating ? 'Preparando…' : 'Compartir mi pantalla'}
					{#if !isCreating}
						<ChevronRight class="h-4 w-4 opacity-70" />
					{/if}
				</Button>
				<a
					href="#join"
					class="btn-secondary inline-flex w-full items-center justify-center gap-2 px-7 py-3.5 text-base sm:w-auto"
				>
					<Link2 class="h-5 w-5" />
					Tengo un enlace
				</a>
			</div>

			<!-- Join card -->
			<div id="join" class="mt-12 w-full max-w-md scroll-mt-24" style="animation-delay: 240ms">
				<Card glass class="text-left">
					<div class="mb-4 flex items-center gap-3">
						<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)]/15 text-[var(--brand)]">
							<Link2 class="h-4 w-4" />
						</span>
						<div>
							<p class="text-sm font-semibold text-[var(--text)]">¿Tienes un enlace?</p>
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
			</div>
		</div>
	</main>

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
			<p class="text-xs text-[var(--text-subtle)]">Comparte tu pantalla con amigos · {new Date().getFullYear()}</p>
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
