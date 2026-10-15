<script lang="ts">
	/**
	 * Privacy page, bilingual. The long legal-ish copy lives here as
	 * locale-keyed blocks (too verbose for the flat dictionary).
	 */
	import { dict, type Locale } from '$lib/i18n/dict';
	import { setLocale } from '$lib/i18n/index.svelte';
	import Brand from '$lib/components/Brand.svelte';
	import { Shield, Lock, Eye, Server, Cookie, BarChart3 } from 'lucide-svelte';

	let { locale }: { locale: Locale } = $props();
	const L = $derived(dict[locale]);
	setLocale(locale);

	const T = $derived(locale === 'es'
		? {
				heading: 'Tu privacidad, en serio',
				summaryTitle: 'En resumen',
				summaryBody: 'Wachaut no guarda tu pantalla, tu audio ni tu chat. Las salas viven en memoria del servidor y desaparecen al cerrarse. No hay cuentas, ni perfiles, ni bases de datos con tu contenido. Todo viaja cifrado.',
				whatTitle: 'Qué datos procesamos',
				what: [
					['Transmisión de pantalla:', 'se envía cifrada (DTLS-SRTP) a través de nuestro servidor SFU hacia los espectadores. No se graba ni almacena en el servidor en ningún momento.'],
					['Mensajes de chat:', 'se mantienen en memoria solo mientras la sala está activa. Al cerrar la sala, se eliminan permanentemente.'],
					['PIN de acceso:', 'se hashea con SHA-256 antes de almacenarse en memoria. Nunca se guarda en texto plano.'],
					['Nombre de usuario:', 'se guarda solo en tu navegador (localStorage) para que no tengas que escribirlo cada vez.'],
				],
				notTitle: 'Lo que no hacemos',
				not: [
					'No guardamos tu pantalla ni tu audio en ningún servidor.',
					'No usamos cookies de seguimiento, publicidad ni rastreadores de terceros.',
					'No vendemos ni compartimos datos con terceros.',
					'No te pedimos que te registres ni des tus datos personales.',
					'No hacemos perfilado ni seguimiento entre webs.',
				],
				statsTitle: 'Estadísticas de uso anónimas',
				statsIntro: 'Para saber cuánta gente usa Wachaut y desde dónde llega (por ejemplo, qué nos trae visitantes de Google o de una campaña), medimos visitas de forma anónima y agregada:',
				stats: [
					'Páginas visitadas, web de origen (referrer), país aproximado, tipo de dispositivo e idioma.',
					'Parámetros de campaña (UTM) presentes en el enlace, si los hay.',
					'Un identificador aleatorio generado en tu navegador — no vinculado a ninguna cuenta ni dato personal (no existen).',
				],
				statsNot: 'Qué no guardamos: tu IP en claro (solo un hash con sal, irreversible), nada que permita identificarte, y ningún dato de terceros. Estos registros se eliminan a los 120 días.',
				localTitle: 'Almacenamiento local',
				localBody: 'Usamos localStorage para guardar tus preferencias en tu propio navegador: tu nombre de usuario, emojis favoritos, si has visto el tutorial y si has silenciado las notificaciones. Estos datos nunca salen de tu dispositivo.',
				recTitle: 'Grabación',
				recBody: 'Si el anfitrión graba una retransmisión, la grabación se hace y se queda íntegramente en su dispositivo. Nunca pasa por nuestros servidores.',
				back: '← Volver al inicio',
			}
		: {
				heading: 'Your privacy, taken seriously',
				summaryTitle: 'In short',
				summaryBody: "Wachaut does not store your screen, audio or chat. Rooms live in server memory and vanish when closed. There are no accounts, no profiles and no databases with your content. Everything travels encrypted.",
				whatTitle: 'What data we process',
				what: [
					['Screen stream:', 'sent encrypted (DTLS-SRTP) through our SFU server to viewers. It is never recorded or stored on the server.'],
					['Chat messages:', 'kept in memory only while the room is active. When the room closes they are permanently deleted.'],
					['Access PIN:', 'hashed with SHA-256 before being stored in memory. Never kept in plain text.'],
					['Username:', 'stored only in your browser (localStorage) so you don’t have to type it every time.'],
				],
				notTitle: 'What we don’t do',
				not: [
					'We never store your screen or audio on any server.',
					'No tracking, advertising or third-party cookies.',
					'We don’t sell or share data with third parties.',
					'We never ask you to sign up or hand over personal data.',
					'No profiling or cross-site tracking.',
				],
				statsTitle: 'Anonymous usage statistics',
				statsIntro: 'To know how many people use Wachaut and where they come from (for example, what brings visitors from Google or a campaign), we measure visits anonymously and in aggregate:',
				stats: [
					'Pages visited, origin website (referrer), approximate country, device type and language.',
					'Campaign parameters (UTM) present on the link, if any.',
					'A random identifier generated in your browser — not linked to any account or personal data (there are none).',
				],
				statsNot: 'What we don’t keep: your raw IP (only a salted, irreversible hash), anything that could identify you, and no third-party data. These records are deleted after 120 days.',
				localTitle: 'Local storage',
				localBody: 'We use localStorage to keep your preferences in your own browser: your username, favorite emojis, whether you’ve seen the tutorial and whether notifications are muted. This data never leaves your device.',
				recTitle: 'Recording',
				recBody: 'If the host records a broadcast, the recording is made and kept entirely on their device. It never passes through our servers.',
				back: '← Back to home',
			});
</script>

<svelte:head>
	<title>{L['privacidad.title']}</title>
	<meta name="description" content={L['privacidad.description']} />
	<link rel="canonical" href="https://wachaut.com{locale === 'es' ? '/privacidad/' : '/en/privacidad/'}" />
	<link rel="alternate" hreflang="es" href="https://wachaut.com/privacidad/" />
	<link rel="alternate" hreflang="en" href="https://wachaut.com/en/privacidad/" />
</svelte:head>

<div class="relative min-h-screen bg-app">
	<nav class="mx-auto max-w-3xl px-4 py-5">
		<a href={locale === 'es' ? '/' : '/en/'} aria-label="Wachaut"><Brand size="md" /></a>
	</nav>

	<!-- Ambient glow -->
	<div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
		<div class="absolute right-0 top-0 h-[420px] w-[420px] rounded-full opacity-20 blur-[120px]" style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"></div>
	</div>

	<main class="mx-auto max-w-3xl px-4 pb-16">
		<div class="mb-10 text-center">
			<span class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/12">
				<Shield class="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
			</span>
			<h1 class="text-3xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">{T.heading}</h1>
		</div>

		<div class="space-y-6">
			<!-- Resumen -->
			<div class="rounded-2xl border border-[var(--brand)]/25 bg-[var(--brand)]/5 p-6">
				<h2 class="mb-3 text-lg font-bold text-[var(--brand)]">{T.summaryTitle}</h2>
				<p class="text-sm leading-relaxed text-[var(--text-muted)]">{T.summaryBody}</p>
			</div>

			<!-- Qué procesamos -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Server class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">{T.whatTitle}</h2>
				</div>
				<ul class="space-y-3 text-sm text-[var(--text-muted)]">
					{#each T.what as [strong, rest] (strong)}
						<li class="flex gap-3">
							<span class="mt-0.5 text-[var(--brand)]">•</span>
							<span><strong class="text-[var(--text)]">{strong}</strong> {rest}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Lo que NO hacemos -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Lock class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">{T.notTitle}</h2>
				</div>
				<ul class="space-y-3 text-sm text-[var(--text-muted)]">
					{#each T.not as item (item)}
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--danger)]">✕</span><span>{item}</span></li>
					{/each}
				</ul>
			</div>

			<!-- Estadísticas anónimas -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<BarChart3 class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">{T.statsTitle}</h2>
				</div>
				<p class="mb-3 text-sm leading-relaxed text-[var(--text-muted)]">{T.statsIntro}</p>
				<ul class="space-y-2 text-sm text-[var(--text-muted)]">
					{#each T.stats as item (item)}
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--brand)]">•</span><span>{item}</span></li>
					{/each}
				</ul>
				<p class="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
					<strong class="text-[var(--text)]">{locale === 'es' ? 'Qué no guardamos:' : 'What we don’t keep:'}</strong>
					{T.statsNot}
				</p>
			</div>

			<!-- localStorage -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Cookie class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">{T.localTitle}</h2>
				</div>
				<p class="text-sm leading-relaxed text-[var(--text-muted)]">{T.localBody}</p>
			</div>

			<!-- Grabación -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Eye class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">{T.recTitle}</h2>
				</div>
				<p class="text-sm leading-relaxed text-[var(--text-muted)]">{T.recBody}</p>
			</div>
		</div>

		<div class="mt-8">
			<a href={locale === 'es' ? '/' : '/en/'} class="text-sm text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]">
				{T.back}
			</a>
		</div>
	</main>
</div>
