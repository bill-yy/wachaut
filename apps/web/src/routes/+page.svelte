<script lang="ts">
	import { Monitor, ArrowRight, Shield, Zap, Globe, Radio, Wifi, Link2, ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let isCreating = $state(false);

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
		if (!url) return;
		try {
			const urlObj = new URL(url);
			goto(urlObj.pathname);
		} catch {
			goto(url.startsWith('/') ? url : `/room/${url}`);
		}
	}
</script>

<svelte:head>
	<title>Wachaut — Comparte tu pantalla al instante</title>
	<meta name="description" content="Comparte tu pantalla con amigos sin registro. Crea una sala, comparte el enlace y listo." />
</svelte:head>

<main class="flex min-h-screen flex-col" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 100%);">
	<!-- Nav -->
	<nav class="w-full px-4 py-4">
		<div class="mx-auto flex max-w-5xl items-center justify-between">
			<div class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 shadow-lg shadow-slate-800/20">
					<Monitor class="h-4 w-4 text-white" />
				</div>
				<span class="text-lg font-bold text-slate-800">Wachaut</span>
			</div>
			<div class="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 ring-1 ring-green-100">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
				</span>
				Activo
			</div>
		</div>
	</nav>

	<!-- Hero -->
	<section class="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
		<div class="mx-auto max-w-xl animate-slide-up">
			<div class="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600 ring-1 ring-blue-100">
				<Wifi class="h-3.5 w-3.5" />
				Conexión directa P2P
			</div>

			<h1 class="mb-4 text-5xl font-extrabold tracking-tight text-slate-800 sm:text-6xl">
				Comparte tu pantalla
			</h1>
			<p class="mb-2 text-lg text-slate-500">
				Sin registro, sin complicaciones.
			</p>
			<p class="mb-10 text-sm text-slate-400">
				Hasta 5 espectadores · Audio incluido · Funciona en cualquier navegador
			</p>

			<!-- CTA buttons -->
			<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<button onclick={shareScreen} disabled={isCreating} class="btn-primary gap-2 px-8 py-4 text-base">
					{#if isCreating}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
						Compartiendo...
					{:else}
						<Radio class="h-5 w-5" />
						Compartir mi pantalla
						<ChevronRight class="h-4 w-4 opacity-60" />
					{/if}
				</button>
				<p class="mt-3 text-xs text-slate-400">Funciona en Chrome, Firefox, Edge y Safari</p>
				<a href="#join" class="btn-secondary gap-2 px-8 py-4 text-base">
					<Link2 class="h-5 w-5" />
					Tengo un enlace
				</a>
			</div>

			<!-- Join card -->
			<div id="join" class="mt-10">
				<div class="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<div class="mb-3 flex items-center gap-3">
						<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
							<Link2 class="h-4 w-4 text-slate-500" />
						</div>
						<div class="text-left">
							<p class="text-sm font-semibold text-slate-700">¿Tienes un enlace?</p>
							<p class="text-xs text-slate-400">Pega el enlace que te ha compartido el anfitrión</p>
						</div>
					</div>
					<div class="flex gap-2">
						<input
							type="text"
							placeholder="https://wachaut.billytech.es/room/..."
							class="input-field flex-1 text-sm"
							bind:value={joinUrl}
							onkeydown={(e) => { if (e.key === 'Enter') handleJoin(); }}
						/>
						<button class="btn-primary px-5" title="Entrar en la sala" onclick={handleJoin}>
							<ArrowRight class="h-5 w-5" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="border-t border-slate-200/60 px-4 py-16 backdrop-blur-sm" style="background: rgba(255,255,255,0.3);">
		<div class="mx-auto max-w-4xl">
			<div class="grid gap-6 sm:grid-cols-3">
				<div class="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex justify-center">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
							<Zap class="h-5 w-5 text-amber-500" />
						</div>
					</div>
					<h3 class="mb-2 text-sm font-bold text-slate-800">Sin registro</h3>
					<p class="text-sm leading-relaxed text-slate-500">Entra y comparte en segundos. Sin cuentas, sin contraseñas.</p>
				</div>
				<div class="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex justify-center">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
							<Globe class="h-5 w-5 text-blue-500" />
						</div>
					</div>
					<h3 class="mb-2 text-sm font-bold text-slate-800">Desde el navegador</h3>
					<p class="text-sm leading-relaxed text-slate-500">No necesitas instalar nada. Funciona en Chrome, Firefox, Edge y Safari.</p>
				</div>
				<div class="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex justify-center">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
							<Shield class="h-5 w-5 text-emerald-500" />
						</div>
					</div>
					<h3 class="mb-2 text-sm font-bold text-slate-800">Privado y seguro</h3>
					<p class="text-sm leading-relaxed text-slate-500">Conexión directa entre vosotros. Sin servidores de por medio.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-slate-200/60 px-4 py-8 text-center" style="background: rgba(255,255,255,0.2);">
		<p class="text-xs text-slate-400">Wachaut — Comparte tu pantalla con amigos</p>
	</footer>
</main>
