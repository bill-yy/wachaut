<script lang="ts">
	import { Lock, User } from 'lucide-svelte';
	import Button from './Button.svelte';

	interface Props {
		/** Username (two-way bound). */
		username: string;
		/** PIN (two-way bound). */
		pin: string;
		onConnect: () => void;
	}

	let { username = $bindable(), pin = $bindable(), onConnect }: Props = $props();

	function sanitizeUsername(value: string): string {
		return value
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^a-zA-Z0-9_-]/g, '')
			.slice(0, 24);
	}

	function onUsernameInput(e: Event) {
		username = sanitizeUsername((e.target as HTMLInputElement).value);
	}

	function onPinInput(e: Event) {
		pin = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && pin.length >= 4 && username.trim().length >= 2) {
			onConnect();
		}
	}

	let canConnect = $derived(pin.length >= 4 && username.trim().length >= 2);
</script>

<div class="w-full max-w-sm">
	<div class="glass relative overflow-hidden rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
		<!-- Ambient glow -->
		<div class="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-3xl gradient-brand"></div>

		<div class="relative mb-6 flex flex-col items-center text-center">
			<div class="relative mb-4">
				<div class="absolute inset-0 rounded-2xl opacity-40 blur-xl gradient-brand"></div>
				<div class="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
					<Lock class="h-7 w-7 text-[var(--brand)]" />
				</div>
			</div>
			<h2 class="text-xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">Unirse a la sala</h2>
			<p class="mt-1 text-sm text-[var(--text-muted)]">Ingresa tu nombre y el PIN de acceso</p>
		</div>

		<!-- Username -->
		<label class="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]" for="va-username">Nombre</label>
		<div class="relative mb-4">
			<User class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
			<input
				id="va-username"
				type="text"
				placeholder="tu-nombre"
				value={username}
				oninput={onUsernameInput}
				onkeydown={onKeydown}
				maxlength="24"
				autocomplete="username"
				class="w-full rounded-xl py-3 pl-10 pr-4 text-sm font-semibold transition-all bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] placeholder:text-[var(--text-subtle)] focus:border-[var(--brand)] focus:outline-none focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand)_18%,transparent)]"
			/>
		</div>

		<!-- PIN -->
		<label class="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]" for="va-pin">PIN</label>
		<input
			id="va-pin"
			type="text"
			inputmode="numeric"
			placeholder="••••••"
			value={pin}
			oninput={onPinInput}
			onkeydown={onKeydown}
			maxlength="6"
			autocomplete="one-time-code"
			class="w-full rounded-xl py-3 text-center text-2xl tracking-[0.5em] font-mono transition-all bg-[var(--surface-2)] text-[var(--brand)] border border-[var(--border)] placeholder:text-[var(--text-subtle)] placeholder:tracking-[0.5em] focus:border-[var(--brand)] focus:outline-none focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand)_18%,transparent)]"
		/>

		<button
			onclick={onConnect}
			disabled={!canConnect}
			class="gradient-brand mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-black shadow-glow transition-all hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100"
		>
			Conectar
		</button>
	</div>
</div>
