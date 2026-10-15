<script lang="ts">
	import Brand from '$lib/components/Brand.svelte';
	import { Shield, Lock, Eye, Server, Cookie, Mailbox, BarChart3 } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Privacidad — Wachaut</title>
	<meta name="description" content="La privacidad de Wachaut: sin registro, sin almacenamiento de tu pantalla, estadísticas anónimas. Todo lo que hacemos y no hacemos con tus datos." />
	<link rel="canonical" href="https://wachaut.com/privacidad" />
</svelte:head>

<div class="relative min-h-screen bg-app">
	<!-- Ambient glow -->
	<div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
		<div
			class="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
			style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"
		></div>
	</div>

	<!-- Nav -->
	<nav class="mx-auto max-w-3xl px-4 py-5">
		<a href="/"><Brand size="md" /></a>
	</nav>

	<!-- Content -->
	<main class="mx-auto max-w-3xl px-4 pb-16">
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-[var(--text)] sm:text-4xl" style="font-family: var(--font-display);">
				Privacidad
			</h1>
			<p class="text-sm text-[var(--text-muted)]">Última actualización: {new Date().getFullYear()}</p>
		</div>

		<div class="space-y-6">
			<!-- Resumen -->
			<div class="rounded-2xl border border-[var(--brand)]/20 bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)]/12">
						<Shield class="h-5 w-5 text-[var(--brand)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">En resumen</h2>
				</div>
				<p class="text-sm leading-relaxed text-[var(--text-muted)]">
					Wachaut no almacena tu contenido. Todo es efímero: las salas se crean en memoria
					y se eliminan completamente al cerrarlas. No tenemos base de datos.
					Tu pantalla se transmite cifrada y nunca se guarda en nuestros servidores.
				</p>
			</div>

			<!-- Qué procesamos -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Server class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">Qué datos procesamos</h2>
				</div>
				<ul class="space-y-3 text-sm text-[var(--text-muted)]">
					<li class="flex gap-3">
						<span class="mt-0.5 text-[var(--brand)]">•</span>
						<span><strong class="text-[var(--text)]">Transmisión de pantalla:</strong> se envía cifrada (DTLS-SRTP) a través de nuestro servidor SFU hacia los espectadores. No se graba ni almacena en el servidor en ningún momento.</span>
					</li>
					<li class="flex gap-3">
						<span class="mt-0.5 text-[var(--brand)]">•</span>
						<span><strong class="text-[var(--text)]">Mensajes de chat:</strong> se mantienen en memoria solo mientras la sala está activa. Al cerrar la sala, se eliminan permanentemente.</span>
					</li>
					<li class="flex gap-3">
						<span class="mt-0.5 text-[var(--brand)]">•</span>
						<span><strong class="text-[var(--text)]">PIN de acceso:</strong> se hashea con SHA-256 antes de almacenarse en memoria. Nunca se guarda en texto plano.</span>
					</li>
					<li class="flex gap-3">
						<span class="mt-0.5 text-[var(--brand)]">•</span>
						<span><strong class="text-[var(--text)]">Nombre de usuario:</strong> se guarda solo en tu navegador (localStorage) para que no tengas que escribirlo cada vez.</span>
					</li>
				</ul>
			</div>

			<!-- Lo que NO hacemos -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Lock class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">Lo que no hacemos</h2>
				</div>
					<ul class="space-y-3 text-sm text-[var(--text-muted)]">
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--danger)]">✕</span><span>No guardamos tu pantalla ni tu audio en ningún servidor.</span></li>
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--danger)]">✕</span><span>No usamos cookies de seguimiento, publicidad ni rastreadores de terceros.</span></li>
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--danger)]">✕</span><span>No vendemos ni compartimos datos con terceros.</span></li>
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--danger)]">✕</span><span>No te pedimos que te registres ni des tus datos personales.</span></li>
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--danger)]">✕</span><span>No hacemos perfilado ni seguimiento entre webs.</span></li>
					</ul>
				</div>

				<!-- Estadísticas anónimas -->
				<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
					<div class="mb-3 flex items-center gap-3">
						<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
							<BarChart3 class="h-5 w-5 text-[var(--text-muted)]" />
						</span>
						<h2 class="text-lg font-bold text-[var(--text)]">Estadísticas de uso anónimas</h2>
					</div>
					<p class="mb-3 text-sm leading-relaxed text-[var(--text-muted)]">
						Para saber cuánta gente usa Wachaut y desde dónde llega (por ejemplo, qué nos trae visitantes
						de Google o de una campaña), medimos visitas de forma anónima y agregada:
					</p>
					<ul class="space-y-2 text-sm text-[var(--text-muted)]">
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--brand)]">•</span><span>Páginas visitadas, web de origen (referrer), país aproximado, tipo de dispositivo e idioma.</span></li>
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--brand)]">•</span><span>Parámetros de campaña (UTM) presentes en el enlace, si los hay.</span></li>
						<li class="flex gap-3"><span class="mt-0.5 text-[var(--brand)]">•</span><span>Un identificador aleatorio generado en tu navegador — no vinculado a ninguna cuenta ni dato personal (no existen).</span></li>
					</ul>
					<p class="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
						<strong class="text-[var(--text)]">Qué no guardamos:</strong> tu IP en claro (solo un hash con sal,
						irreversible), nada que permita identificarte, y ningún dato de terceros. Estos registros se
						eliminan a los 120 días.
					</p>
				</div>

			<!-- localStorage -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Cookie class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">Almacenamiento local</h2>
				</div>
				<p class="text-sm leading-relaxed text-[var(--text-muted)]">
					Usamos <code class="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-xs text-[var(--brand)]">localStorage</code>
					para guardar tus preferencias en tu propio navegador: tu nombre de usuario, emojis favoritos,
					si has visto el tutorial y si has silenciado las notificaciones. Estos datos nunca salen de tu dispositivo.
				</p>
			</div>

			<!-- Grabación -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Eye class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">Grabación</h2>
				</div>
				<p class="text-sm leading-relaxed text-[var(--text-muted)]">
					La grabación es completamente local: el archivo se genera en tu navegador y se descarga
					directamente a tu dispositivo. Nunca pasa por nuestros servidores.
				</p>
			</div>

			<!-- Contacto -->
			<div class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-3 flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
						<Mailbox class="h-5 w-5 text-[var(--text-muted)]" />
					</span>
					<h2 class="text-lg font-bold text-[var(--text)]">Contacto</h2>
				</div>
    <p class="text-sm leading-relaxed text-[var(--text-muted)]">
        ¿Preguntas sobre privacidad o cualquier otra cosa? Escríbenos desde nuestro
        <a href="/contacto" class="text-[var(--brand)] underline-offset-2 hover:underline">formulario de contacto</a>
        — tu mensaje llega directamente a nuestro equipo.
    </p>
			</div>
		</div>

		<!-- Back -->
		<div class="mt-8">
			<a href="/" class="text-sm text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]">
				← Volver al inicio
			</a>
		</div>
	</main>
</div>
