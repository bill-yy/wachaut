<script lang="ts">
	import { Monitor, Users, ArrowRight, Shield, Zap, Globe, ChevronRight, Radio, Wifi } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let pinInput = $state('');
	let pinError = $state('');
	let isJoining = $state(false);
	let isCreating = $state(false);

	async function createRoom() {
		isCreating = true;
		try {
			await goto('/room');
		} catch (err) {
			console.error('Error creating room:', err);
			// Fallback manual navigation
			window.location.href = '/room';
		}
	}

	function validatePin(value: string): boolean {
		pinError = '';
		if (!value) {
			pinError = 'Introduce un PIN';
			return false;
		}
		if (value.length !== 6) {
			pinError = 'El PIN debe tener 6 dígitos';
			return false;
		}
		if (!/^\d{6}$/.test(value)) {
			pinError = 'El PIN solo puede contener números';
			return false;
		}
		return true;
	}

	async function joinWithPin() {
		if (!validatePin(pinInput)) {
			// Shake animation trigger
			const input = document.querySelector('input[name="pin"]') as HTMLInputElement;
			if (input) {
				input.classList.add('animate-shake');
				setTimeout(() => input.classList.remove('animate-shake'), 400);
			}
			return;
		}
		isJoining = true;
		try {
			await goto(`/room/${pinInput}`);
		} catch (err) {
			window.location.href = `/room/${pinInput}`;
		}
	}

	function handlePinInput(e: Event) {
		const target = e.target as HTMLInputElement;
		// Only allow digits
		const cleaned = target.value.replace(/\D/g, '').slice(0, 6);
		pinInput = cleaned;
		if (pinError) pinError = '';
	}

	function handlePinKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			joinWithPin();
		}
	}
</script>

<svelte:head>
	<title>Wachaut — Comparte tu pantalla al instante</title>
	<meta name="description" content="Comparte tu pantalla con amigos sin registro. Crea una sala, comparte el PIN y listo." />
</svelte:head>

<main class="flex min-h-screen flex-col gradient-hero">
	<!-- Navigation -->
	<nav class="w-full px-4 py-4">
		<div class="mx-auto flex max-w-5xl items-center justify-between">
			<div class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 shadow-lg shadow-slate-800/20">
					<Monitor class="h-4.5 w-4.5 text-white" />
				</div>
				<span class="text-lg font-bold text-slate-800">Wachaut</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600">
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
					</span>
					Servicio activo
				</span>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
		<div class="mx-auto max-w-xl animate-slide-up">
			<!-- Badge -->
			<div class="mb-6 flex justify-center">
				<div class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600">
					<Wifi class="h-3.5 w-3.5" />
					Conexión directa P2P
				</div>
			</div>

			<h1 class="mb-4 text-5xl font-extrabold tracking-tight text-slate-800 sm:text-6xl">
				Comparte tu pantalla
			</h1>
			<p class="mb-2 text-lg text-slate-500">
				Sin registro, sin complicaciones. Crea una sala y pasa el PIN.
			</p>
			<p class="mb-10 text-sm text-slate-400">
				Hasta 5 espectadores · Audio incluido · Funciona en cualquier navegador
			</p>

			<!-- Primary Actions -->
			<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<button onclick={createRoom} disabled={isCreating} class="btn-primary gap-2 px-8 py-4 text-base">
					{#if isCreating}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
						Creando sala...
					{:else}
						<Radio class="h-5 w-5" />
						Crear una sala
						<ChevronRight class="h-4 w-4" />
					{/if}
				</button>
				<a href="#join" class="btn-secondary gap-2 px-8 py-4 text-base">
					<Users class="h-5 w-5" />
					Unirse a una sala
				</a>
			</div>

			<!-- PIN Entry Section -->
			<div id="join" class="mt-10">
				<div class="card-static mx-auto max-w-sm">
					<p class="mb-4 text-sm font-medium text-slate-600">¿Tienes un PIN?</p>
					<div class="flex gap-2">
						<div class="relative flex-1">
							<input
								name="pin"
								type="text"
								inputmode="numeric"
								maxlength="6"
								placeholder="000000"
								class="input-field w-full text-center text-xl font-mono tracking-[0.5em] {pinError ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' : ''}"
								value={pinInput}
								oninput={handlePinInput}
								onkeydown={handlePinKeydown}
								disabled={isJoining}
							/>
							{#if pinError}
								<p class="mt-1.5 text-xs text-red-500">{pinError}</p>
							{/if}
						</div>
						<button
							onclick={joinWithPin}
							disabled={isJoining}
							class="btn-primary px-5"
							title="Entrar en la sala"
						>
							{#if isJoining}
								<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
							{:else}
								<ArrowRight class="h-5 w-5" />
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="border-t border-slate-200/60 bg-white/50 px-4 py-16 backdrop-blur-sm">
		<div class="mx-auto max-w-4xl">
			<div class="grid gap-6 sm:grid-cols-3">
				<div class="card text-center">
					<div class="mb-4 flex justify-center">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
							<Zap class="h-6 w-6 text-amber-500" />
						</div>
					</div>
					<h3 class="mb-2 text-sm font-bold text-slate-800">Sin registro</h3>
					<p class="text-sm leading-relaxed text-slate-500">Entra y comparte en segundos. Sin cuentas, sin contraseñas, sin formularios.</p>
				</div>
				<div class="card text-center">
					<div class="mb-4 flex justify-center">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
							<Globe class="h-6 w-6 text-blue-500" />
						</div>
					</div>
					<h3 class="mb-2 text-sm font-bold text-slate-800">Desde el navegador</h3>
					<p class="text-sm leading-relaxed text-slate-500">No necesitas instalar nada. Funciona en Chrome, Firefox, Edge y Safari.</p>
				</div>
				<div class="card text-center">
					<div class="mb-4 flex justify-center">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
							<Shield class="h-6 w-6 text-emerald-500" />
						</div>
					</div>
					<h3 class="mb-2 text-sm font-bold text-slate-800">Privado y seguro</h3>
					<p class="text-sm leading-relaxed text-slate-500">Conexión directa entre vosotros. Sin servidores de por medio viendo tu contenido.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-slate-200/60 bg-white/30 px-4 py-8 text-center backdrop-blur-sm">
		<p class="text-xs text-slate-400">
			Wachaut — Comparte tu pantalla con amigos · Hecho con ❤️ (bueno, con código)
		</p>
	</footer>
</main>
