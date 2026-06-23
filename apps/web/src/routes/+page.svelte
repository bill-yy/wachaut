<script lang="ts">
	import { Monitor, Users, ArrowRight, Shield, Zap, Globe } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	function createRoom() {
		goto('/room');
	}

	function joinRoom() {
		const pin = prompt('Introduce el PIN de la sala:');
		if (pin && pin.length === 6) {
			goto(`/room/${pin}`);
		}
	}
</script>

<svelte:head>
	<title>Wachaut - Comparte tu pantalla con amigos</title>
</svelte:head>

<main class="flex min-h-screen flex-col">
	<!-- Hero Section -->
	<section class="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
		<div class="mx-auto max-w-2xl">
			<!-- Logo/Icon -->
			<div class="mb-6 flex justify-center">
				<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
					<Monitor class="h-8 w-8 text-white" />
				</div>
			</div>

			<h1 class="mb-4 text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl">
				Wachaut
			</h1>
			<p class="mb-2 text-lg text-slate-600">
				Comparte tu pantalla con amigos, sin registro, sin complicaciones.
			</p>
			<p class="mb-10 text-sm text-slate-500">
				Crea una sala, comparte tu pantalla con audio y pasa el enlace. Así de simple.
			</p>

			<!-- CTA Buttons -->
			<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<button onclick={createRoom} class="btn-primary gap-2">
					<Monitor class="h-4 w-4" />
					Crear sala
					<ArrowRight class="h-4 w-4" />
				</button>
				<button onclick={joinRoom} class="btn-secondary gap-2">
					<Users class="h-4 w-4" />
					Unirse a una sala
				</button>
			</div>

			<!-- PIN Input directo -->
			<div class="mt-8">
				<p class="mb-2 text-sm text-slate-500">¿Tienes un PIN?</p>
				<div class="flex gap-2 justify-center">
					<input
						type="text"
						maxlength="6"
						placeholder="000000"
						class="input-field w-32 text-center text-lg font-mono tracking-widest"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								const target = e.target as HTMLInputElement;
								if (target.value.length === 6) goto(`/room/${target.value}`);
							}
						}}
					/>
					<button
						class="btn-primary px-4"
						onclick={() => {
							const input = document.querySelector('input[placeholder="000000"]') as HTMLInputElement;
							if (input?.value.length === 6) goto(`/room/${input.value}`);
						}}
					>
						<ArrowRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="border-t border-slate-200 bg-white px-4 py-12">
		<div class="mx-auto max-w-4xl">
			<div class="grid gap-6 sm:grid-cols-3">
				<div class="card text-center">
					<div class="mb-3 flex justify-center">
						<Zap class="h-6 w-6 text-blue-600" />
					</div>
					<h3 class="mb-1 text-sm font-semibold text-slate-800">Sin registro</h3>
					<p class="text-sm text-slate-500">Entra y comparte en segundos. Sin cuentas, sin contraseñas.</p>
				</div>
				<div class="card text-center">
					<div class="mb-3 flex justify-center">
						<Globe class="h-6 w-6 text-green-600" />
					</div>
					<h3 class="mb-1 text-sm font-semibold text-slate-800">Desde el navegador</h3>
					<p class="text-sm text-slate-500">No necesitas instalar nada. Funciona en Chrome, Firefox y Edge.</p>
				</div>
				<div class="card text-center">
					<div class="mb-3 flex justify-center">
						<Shield class="h-6 w-6 text-slate-600" />
					</div>
					<h3 class="mb-1 text-sm font-semibold text-slate-800">Privado y seguro</h3>
					<p class="text-sm text-slate-500">Conexión directa entre vosotros. Sin servidores de por medio.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-slate-200 bg-slate-50 px-4 py-6 text-center">
		<p class="text-xs text-slate-400">
			Wachaut — Comparte tu pantalla con amigos
		</p>
	</footer>
</main>
