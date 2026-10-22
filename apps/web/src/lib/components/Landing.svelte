<script lang="ts">
	/**
	 * Shared landing (server-rendered per locale): rendered by routes/+page.svelte
	 * (es) and routes/en/+page.svelte (en). All copy comes from the i18n dict;
	 * on mount the chosen locale is persisted so the room UI follows it.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dict, type Locale } from '$lib/i18n/dict';
	import { setLocale } from '$lib/i18n/index.svelte';
	import Brand from '$lib/components/Brand.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';
	import ScreenMockup from '$lib/components/ScreenMockup.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		ArrowRight, Radio, ChevronRight, Zap, Globe, Shield, Users, Monitor, Share2,
	} from 'lucide-svelte';

	let { locale }: { locale: Locale } = $props();

	const L = $derived(dict[locale]);

	onMount(() => {
		setLocale(locale);
		// app.html ships lang="es"; keep <html lang> in sync with the rendered locale.
		document.documentElement.lang = locale;
		if (!localStorage.getItem('wachaut-onboarded')) {
			const t = setTimeout(() => (showOnboarding = true), 600);
			return () => clearTimeout(t);
		}
	});

	let isCreating = $state(false);
	let showOnboarding = $state(false);
	let onboardingStep = $state(0);
	// 'ok' | 'maintenance' | 'down' — from the server's public status route.
	let serviceStatus = $state<'ok' | 'maintenance' | 'down'>('ok');

	async function checkServiceStatus() {
		try {
			const res = await fetch('/api/status', { signal: AbortSignal.timeout(3000) });
			if (!res.ok) throw new Error('bad status');
			const data = await res.json();
			serviceStatus = data.maintenance ? 'maintenance' : 'ok';
		} catch {
			serviceStatus = 'down';
		}
	}

	onMount(() => {
		checkServiceStatus();
		const healthInterval = setInterval(checkServiceStatus, 60000);
		return () => clearInterval(healthInterval);
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
			toast.error(L['landing.joinEmpty']);
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

	const onboardingSteps = $derived([
		{ icon: Monitor, title: L['landing.ob1Title'], description: L['landing.ob1Body'] },
		{ icon: Share2, title: L['landing.ob2Title'], description: L['landing.ob2Body'] },
		{ icon: Users, title: L['landing.ob3Title'], description: L['landing.ob3Body'] },
	]);

	const features = $derived([
		{ icon: Zap, title: L['landing.feature1Title'], body: L['landing.feature1Body'] },
		{ icon: Globe, title: L['landing.feature2Title'], body: L['landing.feature2Body'] },
		{ icon: Shield, title: L['landing.feature3Title'], body: L['landing.feature3Body'] },
	]);

	const StepIcon = $derived(onboardingSteps[onboardingStep].icon);

	const otherHref = locale === 'es' ? '/en/' : '/';
	const otherLabel = locale === 'es' ? 'EN' : 'ES';

	// JSON-LD built as a string: Svelte does not interpolate expressions
	// inside <script> tags in svelte:head.
	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Wachaut',
		url: `https://wachaut.com${locale === 'es' ? '/' : '/en/'}`,
		applicationCategory: 'CommunicationApplication',
		operatingSystem: 'Web',
		description: L['landing.ldDescription'],
		inLanguage: locale,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
		featureList: L['landing.ldFeatures'],
	});
</script>

<svelte:head>
	<title>{L['landing.title']}</title>
	<meta name="description" content={L['landing.description']} />
	<link rel="canonical" href="https://wachaut.com{locale === 'es' ? '/' : '/en/'}" />
	<link rel="alternate" hreflang="es" href="https://wachaut.com/" />
	<link rel="alternate" hreflang="en" href="https://wachaut.com/en/" />
	<link rel="alternate" hreflang="x-default" href="https://wachaut.com/" />
	<meta property="og:title" content={L['landing.title']} />
	<meta property="og:description" content={L['landing.description']} />
	<meta property="og:url" content="https://wachaut.com{locale === 'es' ? '/' : '/en/'}" />
	<meta property="og:locale" content={locale === 'es' ? 'es_ES' : 'en_US'} />
	<meta name="twitter:title" content={L['landing.title']} />
	<meta name="twitter:description" content={L['landing.description']} />
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
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
	<!-- Skip link: first tab stop for keyboard users -->
	<a
		href="#main-content"
		class="sr-only z-50 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
	>
		{locale === 'es' ? 'Saltar al contenido principal' : 'Skip to main content'}
	</a>
	<!-- Nav -->
	<nav class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4" aria-label={locale === 'es' ? 'Principal' : 'Main'}>
		<Brand size="md" />
		<div class="flex items-center gap-3">
			<a
				href={otherHref}
				class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] px-3.5 text-xs font-bold text-[var(--text-muted)] transition-colors hover:border-[var(--brand)]/50 hover:text-[var(--brand)]"
				aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
				translate="no"
			>
				{otherLabel}
			</a>
			<div role="status">
				{#if serviceStatus === 'ok'}
					<Pill tone="success" pulse><span class="hidden sm:inline">{L['landing.statusOk']}</span><span class="sm:hidden">{L['landing.statusOkShort']}</span></Pill>
				{:else if serviceStatus === 'maintenance'}
					<Pill tone="warning"><span class="hidden sm:inline">{L['landing.statusMaintenance']}</span><span class="sm:hidden">{L['landing.statusMaintenanceShort']}</span></Pill>
				{:else}
					<Pill tone="danger"><span class="hidden sm:inline">{L['landing.statusDown']}</span><span class="sm:hidden">{L['landing.statusDownShort']}</span></Pill>
				{/if}
			</div>
		</div>
	</nav>

	<!-- Hero -->
	<main id="main-content" class="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 lg:flex-row lg:items-center lg:gap-16 lg:text-left">
		<div class="stagger flex min-w-0 flex-col items-center lg:items-start lg:flex-1">
			<!-- Announcement pill -->
			<div style="animation-delay: 0ms">
				<span
					class="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-4 py-1.5 text-xs font-medium text-[var(--brand)]"
				>
					<Radio class="h-3.5 w-3.5" aria-hidden="true" />
					{L['landing.announce']}
				</span>
			</div>

			<!-- Headline -->
			<h1
				class="mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--text)] sm:text-6xl lg:text-7xl"
				style="font-family: var(--font-display); animation-delay: 60ms"
			>
				{L['landing.heroTitle']}
				<span class="text-gradient block">{L['landing.heroTitleAccent']}</span>
			</h1>

			<p class="mt-5 max-w-xl text-lg text-[var(--text-muted)]" style="animation-delay: 120ms">
				{L['landing.heroSubtitle']}
			</p>

			<!-- CTAs -->
			<div class="mt-9 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start" style="animation-delay: 200ms">
				<div class="relative">
					<Button onclick={shareScreen} loading={isCreating} size="lg" class="w-full sm:w-auto">
						{#if !isCreating}
							<Radio class="h-5 w-5" aria-hidden="true" />
						{/if}
						{isCreating ? L['landing.ctaPreparing'] : L['landing.cta']}
						{#if !isCreating}
							<ChevronRight class="h-4 w-4 opacity-70" aria-hidden="true" />
						{/if}
					</Button>
					<span
						class="absolute -right-2 -top-2 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-bold text-black shadow-glow"
					>
						{L['landing.ctaFree']}
					</span>
				</div>
				<button
					onclick={() => (showOnboarding = true)}
					class="min-h-[44px] px-4 text-sm font-medium text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]"
				>
					{L['landing.howItWorks']}
				</button>
			</div>
		</div>

		<!-- Mockup (decorative illustration) -->
		<div class="mt-14 w-full max-w-md lg:mt-0 lg:max-w-lg lg:flex-1" style="animation-delay: 240ms">
			<ScreenMockup {locale} />
		</div>
	</main>

	<!-- Join section -->
	<section id="join" class="mx-auto w-full max-w-5xl px-4 py-12" aria-labelledby="join-title">
		<Card glass class="mx-auto max-w-2xl">
			<div class="mb-4 flex items-center gap-3">
				<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/15 text-[var(--brand)]">
					<Users class="h-4 w-4" aria-hidden="true" />
				</span>
				<div class="min-w-0">
					<h2 id="join-title" class="text-sm font-semibold text-[var(--text)]">{L['landing.joinTitle']}</h2>
					<p class="text-xs text-[var(--text-subtle)]">{L['landing.joinSubtitle']}</p>
				</div>
			</div>
			<div class="flex gap-2">
				<div class="min-w-0 flex-1">
					<Input
						type="text"
						placeholder={L['landing.joinPlaceholder']}
						aria-label={L['landing.joinAria']}
						inputmode="url"
						autocapitalize="off"
						spellcheck="false"
						autocomplete="off"
						bind:value={joinUrl}
						onkeydown={(e) => {
							if (e.key === 'Enter') handleJoin();
						}}
					/>
				</div>
				<Button onclick={handleJoin} aria-label={L['landing.joinAria']} class="min-h-[44px] px-5">
					<ArrowRight class="h-5 w-5" aria-hidden="true" />
				</Button>
			</div>
		</Card>
	</section>

	<!-- Features -->
	<section class="mx-auto w-full max-w-5xl px-4 py-16" aria-labelledby="features-title">
		<h2 id="features-title" class="sr-only">{locale === 'es' ? 'Características' : 'Features'}</h2>
		<div class="grid gap-5 sm:grid-cols-3">
			{#each features as f, i (f.title)}
				{@const FeatureIcon = f.icon}
				<Card interactive glass class="stagger" style={`animation-delay: ${i * 80}ms`}>
					<span class="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/12 text-[var(--brand)]">
						<FeatureIcon class="h-5 w-5" aria-hidden="true" />
					</span>
					<h3 class="mb-2 text-base font-bold text-[var(--text)]">{f.title}</h3>
					<p class="text-sm leading-relaxed text-[var(--text-muted)]">{f.body}</p>
				</Card>
			{/each}
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-[var(--border)] px-4 py-8 text-center">
		<div class="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
			<Brand size="sm" />
			<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
				<p class="w-full py-2 text-xs text-[var(--text-subtle)] sm:w-auto">{L['landing.footerTagline']} · {new Date().getFullYear()}</p>
				<a href={locale === 'es' ? '/blog/' : '/en/blog/'} class="py-2.5 text-xs text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]">{L['landing.footerBlog']}</a>
				<a href={locale === 'es' ? '/estado/' : '/en/status/'} class="py-2.5 text-xs text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]">{L['landing.footerStatus']}</a>
				<a href={locale === 'es' ? '/contacto/' : '/en/contacto/'} class="py-2.5 text-xs text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]">{L['landing.footerContact']}</a>
				<a href={locale === 'es' ? '/privacidad/' : '/en/privacidad/'} class="py-2.5 text-xs text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]">{L['landing.footerPrivacy']}</a>
			</div>
		</div>
	</footer>
</div>

<!-- Onboarding -->
<Modal open={showOnboarding} label={L['landing.onboardingLabel']} size="sm" onClose={completeOnboarding}>
	<div class="text-center">
		<!-- Step dots -->
		<div class="mb-6 flex justify-center gap-2">
			{#each onboardingSteps as _, i (i)}
				<button
					class="h-2 rounded-full transition-[width,background-color] duration-300 {i === onboardingStep
						? 'w-8 gradient-brand'
						: 'w-2 bg-[var(--border)]'}"
					aria-label="{L['landing.onboardingStep']} {i + 1} {L['landing.onboardingOf']} {onboardingSteps.length}{i === onboardingStep ? ` (${L['landing.onboardingCurrent']})` : ''}"
					aria-current={i === onboardingStep ? 'step' : undefined}
					onclick={() => (onboardingStep = i)}
				></button>
			{/each}
		</div>

		<div class="mb-5 flex justify-center">
			<span class="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--brand)]/12 text-[var(--brand)]">
				<StepIcon class="h-10 w-10" aria-hidden="true" />
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
						{L['landing.next']}
						<ChevronRight class="h-4 w-4" aria-hidden="true" />
					</Button>
			{:else}
				<Button onclick={completeOnboarding} class="w-full">{L['landing.gotIt']}</Button>
			{/if}
			<Button variant="ghost" onclick={completeOnboarding} class="w-full">{L['landing.skip']}</Button>
		</div>
	</div>
</Modal>
