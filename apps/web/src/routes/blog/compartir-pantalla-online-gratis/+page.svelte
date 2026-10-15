<script lang="ts">
	import ArticleLayout from '$lib/components/ArticleLayout.svelte';

	const date = '2026-10-15';

	const faqs = [
		{
			q: '¿Cuál es la forma más rápida de compartir pantalla?',
			a: 'Un enlace instantáneo sin registro: entras en Wachaut, eliges qué compartir y mandas el enlace. Menos de un minuto hasta que la otra persona te está viendo.',
		},
		{
			q: '¿Wachaut es gratis de verdad?',
			a: 'Sí, del todo: sin planes, sin límites de tiempo y sin pedir tarjeta. Las salas se cierran al terminar y no guardamos tu contenido.',
		},
		{
			q: '¿Cada cuánta gente cuento para una sala?',
			a: 'Hasta 20 espectadores por sala en tiempo real. Para más gente (un curso completo, etc.) Zoom o Meet se ajustan mejor hoy por hoy.',
		},
		{
			q: '¿Qué pasa si mi conexión es lenta?',
			a: 'Wachaut baja la calidad automáticamente para ir fluido (y puedes elegir preset manual). Herramientas pesadas con videollamada completa sufren más texto borroso.',
		},
		{
			q: '¿Se puede compartir también el audio?',
			a: 'En Wachaut sí: al compartir pantalla puedes incluir el audio del sistema, útil para mostrar vídeos o clips.',
		},
	];
</script>

<ArticleLayout locale="es" pathEs="/blog/compartir-pantalla-online-gratis" pathEn="/en/blog/free-online-screen-sharing" title="Compartir pantalla online gratis: comparativa de las mejores opciones" description="Comparativa práctica de herramientas gratis para compartir pantalla online (Wachaut, Zoom, Meet, Discord y AnyDesk): registro, instalación, límites y cuándo usar cada una." h1="Compartir pantalla online gratis: ¿qué herramienta elijo?" {date} faqs={faqs}>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Hay más formas de compartir pantalla que nunca y, a la vez, mas límites nuevos en las "versiones gratis". La herramienta adecuada depende de tres preguntas: <strong class="text-[var(--text)]">¿te van a obligar a registrarte?, ¿hay que instalar algo?, ¿cuánta gente se conectará?</strong> Aquí las comparamos con datos de uso real —sin marketing— para que elijas rápido.
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
					<td class="p-3 font-semibold text-[var(--text)]">Discord</td>
					<td class="p-3">Sí</td>
					<td class="p-3">Recomendada</td>
					<td class="p-3">Sin límite duración</td>
					<td class="p-3">Comunidades / gaming</td>
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

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">Si buscas rapidez: el caso de "comparto y fuera"</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Situación típica: "mira cómo se hace esto" a un amigo, enseñar una jugada a tus compañeros del grupo, avisar a tu madre de un ajuste de móvil. Ningún software de reuniones compensa pedirle registro a alguien para 2 minutos de pantalla. Para eso está <a href="/room" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">Wachaut</a>: abres sala, compartes el enlace (por WhatsApp, Telegram o donde sea) y en segundos todos ven tu pantalla en tiempo real, con audio y chat. Sin cuentas: cuando terminas, la sala desaparece.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">Si es trabajo en serio: cuando sí conviene Zoom o Meet</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Reuniones con agenda, grabación profesional, salas paralelas e integración con calendario — Zoom y Meet son las herramientas de referencia. Su coste: registro obligatorio del host y la cuenta de correo atada al calendario. Para trabajo recurrente merece la pena; para usos esporádicos es un peso inútil.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">¿Y Discord?</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Discord es excelente si <em>ya tienes comunidad allí</em>: comparte pantalla de calidad dentro de un canal de voz sin límite de duración en su uso normal, gratis. El pero: todos los demás tienen que registrarse e instalarse la app. Si tu público no está en Discord, crearles una cuenta solo para enseñarles algo no tiene sentido — Wachaut cubre justo ese hueco.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">Resumen: regla rápida</h2>
	<ul class="ml-1 list-disc space-y-2 pl-5 text-[var(--text-muted)]">
		<li><strong class="text-[var(--text)]">1–20 personas, ahora mismo, sin complicaciones</strong> → Wachaut (enlace instantáneo).</li>
		<li><strong class="text-[var(--text)]">Reunión formal con agenda y grabación</strong> → Zoom o Meet.</li>
		<li><strong class="text-[var(--text)]">Comunidad con el app ya instalada</strong> → Discord.</li>
		<li><strong class="text-[var(--text)]">Controlar el PC de otra persona</strong> → AnyDesk (otro caso de uso).</li>
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
		Ver también: <a href="/blog/como-compartir-pantalla-por-whatsapp/" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">cómo compartir pantalla por WhatsApp</a>.
	</p>
</ArticleLayout>
