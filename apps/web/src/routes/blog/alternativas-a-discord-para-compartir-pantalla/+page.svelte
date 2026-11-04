<script lang="ts">
	import ArticleLayout from '$lib/components/ArticleLayout.svelte';

	const date = '2026-11-04';

	const faqs = [
		{
			q: '¿Cuál es la mejor alternativa gratis a Discord?',
			a: 'Depende del caso: para enseñar la pantalla ya mismo sin que nadie se registre, Wachaut; para reuniones con grabación, Zoom o Meet; si buscas software libre, Jitsi Meet.',
		},
		{
			q: '¿Hay alguna opción donde nadie tenga que instalar nada?',
			a: 'Sí: Wachaut y Jitsi Meet funcionan en el navegador para todos, sin cuentas ni descargas. Google Meet tampoco exige instalación, pero sí cuenta de Google.',
		},
		{
			q: '¿Por qué no usar Discord directamente?',
			a: 'Si tu gente ya tiene cuenta y la app instalada, Discord es buena opción. El problema aparece cuando tus espectadores no la tienen: pedirles registro e instalación para verte la pantalla 5 minutos es demasiada fricción.',
		},
		{
			q: '¿Cuál es el límite al compartir pantalla en Discord?',
			a: 'Todos necesitan cuenta y, en la práctica, la app de escritorio para compartir con soltura. La calidad (resolución y fps) depende del boost del servidor o de Nitro, y en el uso normal no hay límite de duración. Si tu gente ya está dentro apenas notarás límites; si no lo está, la fricción de entrada es el mayor obstáculo.',
		},
		{
			q: '¿Cuántos espectadores soporta Wachaut?',
			a: 'Hasta 20 espectadores en tiempo real por sala, con chat y audio del sistema incluidos. Cubre la mayoría de grupos, clases pequeñas y equipos.',
		},
		{
			q: '¿Wachaut es gratis de verdad?',
			a: 'Sí: sin planes, sin límite de tiempo y sin pedir tarjeta. Al cerrar la sala el enlace deja de funcionar y no se guarda tu contenido.',
		},
	];
</script>

<ArticleLayout locale="es" pathEs="/blog/alternativas-a-discord-para-compartir-pantalla" pathEn="/en/blog/discord-alternatives-for-screen-sharing" title="Alternativas a Discord para compartir pantalla sin cuenta" description="¿Quieres enseñar tu pantalla sin que nadie se registre ni instale Discord? Wachaut, Zoom, Meet y Jitsi comparados según registro, instalación y límites." h1="Alternativas a Discord para compartir pantalla" {date} faqs={faqs}>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Discord es genial para compartir pantalla <em>dentro de una comunidad</em>: calidad alta, sin límite de duración y todo el mundo ya está allí. El problema es cuando la gente que te tiene que ver <strong class="text-[var(--text)]">no está allí</strong>: para verte la pantalla necesitan crear una cuenta, instalarse la app y entender cómo funciona un servidor. Si solo quieres enseñar algo a tu familia, tus compañeros de clase o un cliente, esa fricción sobra. Estas son las alternativas según cada caso.
	</p>

	<div class="overflow-x-auto rounded-xl border border-[var(--border)]">
		<table class="w-full min-w-[640px] border-collapse text-sm">
			<thead>
				<tr class="bg-[var(--surface-2)] text-left text-[var(--text)]">
					<th class="p-3 font-semibold">Herramienta</th>
					<th class="p-3 font-semibold">Registro</th>
					<th class="p-3 font-semibold">Instalación</th>
					<th class="p-3 font-semibold">Gratis</th>
					<th class="p-3 font-semibold">Apto para</th>
				</tr>
			</thead>
			<tbody class="text-[var(--text-muted)]">
				<tr class="border-t border-[var(--border)] bg-[var(--brand)]/5">
					<td class="p-3 font-semibold text-[var(--brand)]">Wachaut</td>
					<td class="p-3">No</td>
					<td class="p-3">No (navegador)</td>
					<td class="p-3">Sin límites de tiempo</td>
					<td class="p-3">Espontáneo, 1–20 espectadores</td>
				</tr>
				<tr class="border-t border-[var(--border)]">
					<td class="p-3 font-semibold text-[var(--text)]">Zoom</td>
					<td class="p-3">Sí (host)</td>
					<td class="p-3">Sí (host)</td>
					<td class="p-3">40 min por reunión</td>
					<td class="p-3">Reuniones de trabajo</td>
				</tr>
				<tr class="border-t border-[var(--border)]">
					<td class="p-3 font-semibold text-[var(--text)]">Google Meet</td>
					<td class="p-3">Sí</td>
					<td class="p-3">No</td>
					<td class="p-3">60 min / 100 pers.</td>
					<td class="p-3">Trabajo con cuenta Google</td>
				</tr>
				<tr class="border-t border-[var(--border)]">
					<td class="p-3 font-semibold text-[var(--text)]">Jitsi Meet</td>
					<td class="p-3">No</td>
					<td class="p-3">No (navegador)</td>
					<td class="p-3">Sin límites de tiempo</td>
					<td class="p-3">Software libre</td>
				</tr>
				<tr class="border-t border-[var(--border)]">
					<td class="p-3 font-semibold text-[var(--text)]">AnyDesk</td>
					<td class="p-3">No</td>
					<td class="p-3">Sí (ambos)</td>
					<td class="p-3">Uso personal</td>
					<td class="p-3">Control remoto de PCs</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">La alternativa sin fricción: un enlace al que entrar</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Lo contrario a Discord es exactamente esto: nadie se registra, nadie instala nada, nadie aprende qué es un servidor. Abres sala en <a href="/room" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">Wachaut</a>, compartes el enlace por WhatsApp o donde sea y cada persona entra desde su navegador. Tu pantalla se ve en calidad completa (hasta 1080p y 60 fps), con audio y chat, para hasta 20 espectadores en tiempo real. Al terminar cierras la sala y el enlace muere: no queda nada guardado.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">Si lo que necesitas es una videollamada: Zoom o Meet</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Cuando compartir pantalla va acompañado de una reunión de verdad —agenda, varias personas hablando, grabación— Zoom y Google Meet son la respuesta estándar. Ambos piden cuenta al anfitrión (y Meet vive atado a Google) y limitan las reuniones gratis a 40 y 60 minutos respectivamente. Perfecto para trabajo; demasiado peso para enseñar algo puntual.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">La opción de software libre: Jitsi Meet</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Jitsi Meet es open source, funciona en el navegador sin cuentas y no tiene límites artificiales. A cambio, la calidad de vídeo es más irregular que las opciones comerciales, sobre todo con muchos participantes. Si para ti el "libre" pesa más que la pulcritud, es una alternativa honesta.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">Cuándo Discord sigue siendo la mejor opción</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Seamos justos: si tu grupo ya vive en Discord —gaming, comunidades, tu equipo técnico— no hay razón para salir. Allí compartes pantalla con buena calidad y sin límite de duración en el uso normal, y nadie tiene que crear nada nuevo. Discord deja de encajar cuando tu público no está dentro: la cuenta obligatoria, la app y el modelo de servidores son una barrera para quien solo quiere verte la pantalla un rato.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">Resumen: regla rápida</h2>
	<ul class="ml-1 list-disc space-y-2 pl-5 text-[var(--text-muted)]">
		<li><strong class="text-[var(--text)]">Tu público no tiene Discord y quieres hacerlo fácil</strong> → Wachaut (enlace instantáneo).</li>
		<li><strong class="text-[var(--text)]">Reunión formal con agenda y grabación</strong> → Zoom o Meet.</li>
		<li><strong class="text-[var(--text)]">Software libre sí o sí</strong> → Jitsi Meet.</li>
		<li><strong class="text-[var(--text)]">Todo el mundo ya está en Discord</strong> → quédate en Discord.</li>
		<li><strong class="text-[var(--text)]">Controlar el PC de otra persona</strong> → AnyDesk (es otro caso de uso).</li>
	</ul>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">Preguntas frecuentes</h2>
	<div class="space-y-3">
		{#each faqs as f}
			<details class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 open:border-[var(--brand)]/25">
				<summary class="cursor-pointer list-none text-sm font-semibold text-[var(--text)] marker:hidden">
					{f.q}
				</summary>
				<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{f.a}</p>
			</details>
		{/each}
	</div>

	<p class="pt-2 text-sm text-[var(--text-subtle)]">
		Ver también: <a href="/blog/compartir-pantalla-online-gratis/" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">comparativa de herramientas gratis para compartir pantalla</a> y <a href="/blog/como-compartir-pantalla-por-whatsapp/" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">cómo compartir pantalla por WhatsApp</a>.
	</p>
</ArticleLayout>
