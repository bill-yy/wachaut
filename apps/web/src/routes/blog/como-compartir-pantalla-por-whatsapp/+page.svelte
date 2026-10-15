<script lang="ts">
	import ArticleLayout from '$lib/components/ArticleLayout.svelte';

	const date = '2026-10-15';

	const howtoLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: 'Cómo compartir la pantalla por WhatsApp con Wachaut',
		description: 'Comparte tu pantalla con cualquier contacto de WhatsApp en menos de un minuto, sin instalar nada en su móvil ni en tu PC.',
		totalTime: 'PT1M',
		tool: [{ '@type': 'HowToTool', name: 'Un navegador (Chrome, Firefox, Edge o Safari)' }],
		step: [
			{ '@type': 'HowToStep', position: 1, name: 'Abre una sala en Wachaut', text: 'Entra en wachaut.com y pulsa "Compartir mi pantalla". No hace falta registrarse ni instalar nada.' },
			{ '@type': 'HowToStep', position: 2, name: 'Elige qué compartir', text: 'El navegador te pedirá permiso: selecciona una ventana, una aplicación concreta o toda la pantalla. Marca "compartir audio" si quieres que también se oiga.' },
			{ '@type': 'HowToStep', position: 3, name: 'Copia el enlace de invitación', text: 'La sala genera un enlace con el PIN de acceso ya incluido. Cópialo con un clic.' },
			{ '@type': 'HowToStep', position: 4, name: 'Envíalo por WhatsApp', text: 'Pégalo en el chat de WhatsApp de quien quieras que te vea (una persona o un grupo). Al abrirlo entra directamente a ver tu pantalla en tiempo real.' },
		],
	});

	const faqs = [
		{
			q: '¿La persona que recibe el enlace tiene que instalar algo?',
			a: 'No. Solo necesita abrir el enlace desde cualquier navegador, del móvil o del ordenador. Ni registro ni descargas para nadie.',
		},
		{
			q: '¿Cuánta gente puede ver mi pantalla a la vez?',
			a: 'Hasta 20 espectadores en tiempo real en la misma sala. Para grupos de WhatsApp grandes es más que suficiente.',
		},
		{
			q: '¿El enlace de la sala caduca?',
			a: 'Puedes proteger la sala con un PIN de 6 dígitos y cerrarla cuando quieras. Al terminar la emisión, la sala desaparece y el enlace deja de funcionar.',
		},
		{
			q: '¿Funciona en el PC sin instalar aplicaciones?',
			a: 'Sí. Wachaut funciona directamente en Chrome, Firefox, Edge y Safari, tanto en Windows como en Mac o Linux.',
		},
		{
			q: '¿La calidad del vídeo es buena?',
			a: 'En una videollamada de WhatsApp la calidad de la compartición depende de la llamada y baja bastante. Con Wachaut se emite en calidad completa (hasta 1080p, 60 fps) con audio, y quien mira la recibe casi en directo.',
		},
	];
</script>

<ArticleLayout locale="es" pathEs="/blog/como-compartir-pantalla-por-whatsapp" pathEn="/en/blog/how-to-share-your-screen-on-whatsapp" title="Cómo compartir la pantalla por WhatsApp (2026) — guía rápida" description="WhatsApp permite compartir pantalla en videollamadas, pero con límites. Cómo hacerlo paso a paso y la alternativa sin registro para grupos de hasta 20 personas." h1="Cómo compartir la pantalla por WhatsApp" {date} faqs={faqs} extraLd={[howtoLd]}>
	<p class="text-[var(--text-muted)] leading-relaxed">
		WhatsApp es la app de mensajería más usada de España y Latinoamérica: si quieres enseñar algo<span class="text-[var(--text)]"> —un vídeo, una jugada del partido, un error en el móvil de tu madre— lo más natural es abrir WhatsApp y mandárselo a la otra persona</span>. Pero compartir la <strong class="text-[var(--text)]">pantalla en vivo</strong> por WhatsApp tiene truco: depende de la videollamada, consume batería y la calidad deja que desear. Aquí tienes las dos formas de hacerlo, ordenadas de menos a más fiable.
	</p>

	<h2 class="pt-4 text-xl font-bold text-[var(--text)]">Opción 1: compartir pantalla en una videollamada de WhatsApp</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		WhatsApp incluye compartición de pantalla dentro de sus videollamadas (móvil y desktop). Es rápido si ya estáis en ellas, pero vale la pena conocer sus límites.
	</p>
	<ol class="ml-1 list-decimal space-y-2 pl-5 text-[var(--text-muted)]">
		<li>Inicia una <strong class="text-[var(--text)]">videollamada</strong> con la persona o el grupo.</li>
		<li>Toca el botón de <strong class="text-[var(--text)]">Compartir pantalla</strong> entre los controles de la llamada.</li>
		<li>Confirma el aviso (WhatsApp informa de que se compartirá lo que veas) y elige la app o pantalla.</li>
		<li>Para parar, vuelve a la llamada y pulsa el botón de nuevo o "Dejar de compartir".</li>
	</ol>
	<div class="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-4 text-sm text-[var(--text-muted)]">
		<strong class="text-[var(--warning)]">Límites a tener en cuenta:</strong>
		<ul class="mt-2 list-disc space-y-1 pl-5">
			<li>La calidad se adapta a la llamada, no a tu pantalla: texto y mínimos detalles se ven borrosos.</li>
			<li>En móvil, cambiar de app puede cortar la compartición; la batería se consume rápido.</li>
			<li>Con grupos grandes la videollamada se degrada, y compartes pantalla <em>y</em> cámara a la vez no siempre es posible.</li>
			<li>Si son varias personas las que tienen que ver tu pantalla a la vez, la videollamada no es el escenario ideal.</li>
		</ul>
	</div>

	<h2 class="pt-4 text-xl font-bold text-[var(--text)]">Opción 2 (recomendada): comparte por WhatsApp un enlace de Wachaut</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Genera una emisión de tu pantalla en <a href="/room" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">wachaut.com</a> — sin registro, sin instalar nada — y comparte por WhatsApp el <strong class="text-[var(--text)]">enlace + PIN</strong> que sale. Quien lo abra entra directamente a ver tu pantalla en calidad completa. Es la mejor forma de compartir algo con grupos de WhatsApp en vivo: no compites por el ancho de banda de la videollamada y todos entran con un toque.
	</p>
	<ol class="ml-1 list-decimal space-y-2 pl-5 text-[var(--text-muted)]">
		<li>Abre <a href="/room" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">wachaut.com/room</a> y pulsa "Compartir mi pantalla".</li>
		<li>Selecciona la ventana o pantalla; marca la casilla de audio si aplica.</li>
		<li>Copia la invitación (enlace con PIN incluido con un toque).</li>
		<li>Pégala en el chat/grupo de WhatsApp. Listo: hasta 20 espectadores en tiempo real.</li>
	</ol>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Al ser un enlace, <strong class="text-[var(--text)]">no importa dónde esté cada quien</strong>: en WhatsApp al PC, viceversa, en grupo grande o de uno a uno. Y cuando terminas, cierras la sala y los enlaces dejan de funcionar: nada queda guardado.
	</p>

	<h2 class="pt-4 text-xl font-bold text-[var(--text)]">Preguntas frecuentes</h2>
	<div class="space-y-3">
		{#each faqs as f}
			<details class="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 open:border-[var(--brand)]/25">
				<summary class="cursor-pointer list-none text-sm font-semibold text-[var(--text)] marker:hidden">
					{f.q}
				</summary>
				<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{f.a}</p>
			</details>
		{/each}
	</div>

	<p class="pt-2 text-sm text-[var(--text-subtle)]">
		¿Buscas más opciones? En <a href="/blog/compartir-pantalla-online-gratis/" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">compartir pantalla online gratis</a> comparamos las alternativas. Y si dudas de qué hacemos con tus datos, lee cómo gestionamos <a href="/privacidad/" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">privacidad</a>.
	</p>
</ArticleLayout>
