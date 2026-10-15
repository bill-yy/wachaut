<script lang="ts">
	/**
	 * Shared scaffold for SEO content pages (blog): breadcrumb, h1, meta
	 * (canonical/hreflang/og), JSON-LD (Article + BreadcrumbList + optional
	 * HowTo/FAQPage passed in), children body, and an end-of-article CTA.
	 */
	import Brand from '$lib/components/Brand.svelte';
	import { dict, type Locale } from '$lib/i18n/dict';
	import { ChevronRight, MonitorPlay } from 'lucide-svelte';

	interface Props {
		locale: Locale;
		title: string;
		description: string;
		h1: string;
		/** Prerender date ISO (datePublished). */
		date: string;
		/** Path without trailing slash, e.g. /blog/como-… */
		pathEs: string;
		pathEn: string;
		faqs?: { q: string; a: string }[];
		/** Extra JSON-LD object strings (HowTo etc). */
		extraLd?: string[];
		children?: import('svelte').Snippet;
	}

	let { locale, title, description, h1, date, pathEs, pathEn, faqs = [], extraLd = [], children }: Props = $props();

	const L = $derived(dict[locale]);
	const path = $derived(locale === 'es' ? pathEs : pathEn);
	const pairPath = $derived(locale === 'es' ? pathEn : pathEs);
	const url = $derived(`https://wachaut.com${path}/`);

	const articleLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: title,
			description: description,
			datePublished: date,
			dateModified: date,
			inLanguage: locale === 'es' ? 'es' : 'en',
			image: 'https://wachaut.com/brand-marks/og.png',
			author: { '@type': 'Organization', name: 'Wachaut' },
			publisher: { '@type': 'Organization', name: 'Wachaut', logo: { '@type': 'ImageObject', url: 'https://wachaut.com/icon-512.png' } },
			mainEntityOfPage: url,
		})
	);
	const breadcrumbLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Wachaut', item: locale === 'es' ? 'https://wachaut.com/' : 'https://wachaut.com/en/' },
				{ '@type': 'ListItem', position: 2, name: L['blog.hub'], item: `${'https://wachaut.com'}${locale === 'es' ? '/blog/' : '/en/blog/'}` },
				{ '@type': 'ListItem', position: 3, name: title, item: url },
			],
		})
	);
	const faqLd = $derived(
		faqs.length
			? JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
				})
			: ''
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<link rel="alternate" hreflang="es" href="https://wachaut.com{pathEs}/" />
	<link rel="alternate" hreflang="en" href="https://wachaut.com{pathEn}/" />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:locale" content={locale === 'es' ? 'es_ES' : 'en_US'} />
	<meta property="og:locale:alternate" content={locale === 'es' ? 'en_US' : 'es_ES'} />
	<meta property="article:published_time" content={date} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{@html `<script type="application/ld+json">${articleLd}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbLd}</script>`}
	{#if faqLd}
		{@html `<script type="application/ld+json">${faqLd}</script>`}
	{/if}
	{#each extraLd as ld}
		{@html `<script type="application/ld+json">${ld}</script>`}
	{/each}
</svelte:head>

<div class="relative min-h-screen bg-app">
	<nav class="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
		<a href={locale === 'es' ? '/' : '/en/'} aria-label="Wachaut"><Brand size="md" /></a>
		<a href={locale === 'es' ? pairPath : pathEs} class="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-bold text-[var(--text-muted)] transition-colors hover:border-[var(--brand)]/50 hover:text-[var(--brand)]">
			{locale === 'es' ? 'EN' : 'ES'}
		</a>
	</nav>

	<div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
		<div class="absolute right-0 top-0 h-[420px] w-[420px] rounded-full opacity-20 blur-[120px]" style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"></div>
	</div>

	<main class="mx-auto max-w-3xl px-4 pb-16">
		<nav aria-label="Breadcrumb" class="mb-6 flex items-center gap-1 text-xs text-[var(--text-subtle)]">
			<a href={locale === 'es' ? '/' : '/en/'} class="transition-colors hover:text-[var(--brand)]">{locale === 'es' ? 'Inicio' : 'Home'}</a>
			<ChevronRight class="h-3 w-3" aria-hidden="true" />
			<a href={locale === 'es' ? '/blog/' : '/en/blog/'} class="transition-colors hover:text-[var(--brand)]">{L['blog.hub']}</a>
			<ChevronRight class="h-3 w-3" aria-hidden="true" />
			<span class="text-[var(--text-muted)]" aria-current="page">{h1}</span>
		</nav>

		<header class="mb-8">
			<h1 class="text-3xl font-bold leading-tight text-[var(--text)] sm:text-4xl" style="font-family: var(--font-display);">
				{h1}
			</h1>
			<p class="mt-3 text-sm text-[var(--text-subtle)]">
				{new Date(`${date}T12:00:00`).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
				· {L['blog.byline']}
			</p>
		</header>

		<div class="prose-wachaut space-y-5">
			{@render children?.()}
		</div>

		<!-- CTA -->
		<div class="mt-12 rounded-2xl border border-[var(--brand)]/25 bg-[var(--brand)]/5 p-6 text-center">
			<span class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)]/15">
				<MonitorPlay class="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
			</span>
			<h2 class="mb-2 text-lg font-bold text-[var(--text)]">{L['blog.ctaTitle']}</h2>
			<p class="mb-5 text-sm text-[var(--text-muted)]">{L['blog.ctaBody']}</p>
			<a href="/room" class="gradient-brand inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-black shadow-glow transition-all hover:brightness-110">
				{L['blog.ctaButton']}
			</a>
		</div>
	</main>
</div>
