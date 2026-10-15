<script lang="ts">
	// Blog index (EN).
	import { dict } from '$lib/i18n/dict';
	import Brand from '$lib/components/Brand.svelte';
	import { ArrowRight } from 'lucide-svelte';

	const L = dict.en;

	const posts = [
		{
			href: '/en/blog/how-to-share-your-screen-on-whatsapp/',
			title: 'How to share your screen on WhatsApp',
			description: 'Step by step inside the native video call, plus the instant-link way for up to 20 viewers.',
			lang: 'Guide',
		},
		{
			href: '/en/blog/free-online-screen-sharing/',
			title: 'Free online screen sharing: the comparison',
			description: 'Wachaut vs Zoom, Meet, Discord and AnyDesk: sign-up, installs and when to use each.',
			lang: 'Comparison',
		},
	];
</script>

<svelte:head>
	<title>{L['blog.hubTitle']}</title>
	<meta name="description" content={L['blog.hubDescription']} />
	<link rel="canonical" href="https://wachaut.com/en/blog/" />
	<link rel="alternate" hreflang="es" href="https://wachaut.com/blog/" />
	<link rel="alternate" hreflang="en" href="https://wachaut.com/en/blog/" />
	<meta property="og:title" content={L['blog.hubTitle']} />
	<meta property="og:description" content={L['blog.hubDescription']} />
	<meta property="og:url" content="https://wachaut.com/en/blog/" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:locale:alternate" content="es_ES" />
	<meta name="twitter:title" content={L['blog.hubTitle']} />
	<meta name="twitter:description" content={L['blog.hubDescription']} />
</svelte:head>

<div class="relative min-h-screen bg-app">
	<nav class="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
		<a href="/en/" aria-label="Wachaut"><Brand size="md" /></a>
		<a href="/blog/" class="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-bold text-[var(--text-muted)] transition-colors hover:border-[var(--brand)]/50 hover:text-[var(--brand)]">ES</a>
	</nav>

	<div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
		<div class="absolute right-0 top-0 h-[420px] w-[420px] rounded-full opacity-20 blur-[120px]" style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"></div>
	</div>

	<main class="mx-auto max-w-3xl px-4 pb-16">
		<header class="mb-8">
			<h1 class="text-3xl font-bold text-[var(--text)] sm:text-4xl" style="font-family: var(--font-display);">{L['blog.hubTitle']}</h1>
			<p class="mt-3 text-[var(--text-muted)]">{L['blog.hubIntro']}</p>
		</header>

		<div class="space-y-4">
			{#each posts as post}
				<a
					href={post.href}
					class="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--brand)]/40 hover:shadow-glow"
				>
					<span class="mb-2 inline-block rounded-full bg-[var(--brand)]/12 px-2.5 py-0.5 text-[11px] font-bold text-[var(--brand)]">{post.lang}</span>
					<h2 class="mb-1 text-lg font-bold text-[var(--text)]">{post.title}</h2>
					<p class="text-sm text-[var(--text-muted)]">{post.description}</p>
					<span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">
						Read <ArrowRight size={14} aria-hidden="true" />
					</span>
				</a>
			{/each}
		</div>

		<p class="mt-8 text-sm text-[var(--text-subtle)]">
			<a href="/en/" class="transition-colors hover:text-[var(--brand)]">{L['blog.back']}</a>
		</p>
	</main>
</div>
