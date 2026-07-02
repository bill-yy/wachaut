<script lang="ts">
	import { Monitor, Wifi, WifiOff, AlertTriangle } from 'lucide-svelte';
	import Spinner from './Spinner.svelte';
	import Button from './Button.svelte';

	type Status = 'connecting' | 'auth' | 'waiting' | 'error' | 'disconnected' | 'reconnecting';

	interface Props {
		status: Status;
		errorMessage?: string;
		reconnectAttempt?: number;
		onRetry: () => void;
		onReconnect?: () => void;
		onCancel?: () => void;
		onLeave?: () => void;
	}

	let { status, errorMessage = '', reconnectAttempt = 0, onRetry, onReconnect, onCancel, onLeave }: Props = $props();
</script>

<div class="flex items-center justify-center" style="min-height: 60vh;">
	<div class="w-full max-w-sm text-center">
		{#if status === 'connecting' || status === 'auth'}
			<div class="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
				<div class="absolute inset-0 rounded-full opacity-40 blur-xl gradient-brand"></div>
				<div class="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)]">
					<Wifi class="h-7 w-7 text-[var(--brand)]" />
				</div>
			</div>
			<p class="font-medium text-[var(--text)]">
				{status === 'connecting' ? 'Conectando…' : 'Autenticando…'}
			</p>
			<p class="mt-1 text-sm text-[var(--text-muted)]">Verificando PIN con el anfitrión</p>

		{:else if status === 'waiting'}
			<div class="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
				<div class="absolute inset-0 rounded-full opacity-30 blur-2xl gradient-brand animate-pulse-slow"></div>
				<div class="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)]">
					<Monitor class="h-10 w-10 text-[var(--text-subtle)]" />
				</div>
			</div>
			<h2 class="mb-2 text-lg font-bold text-[var(--text)]" style="font-family: var(--font-display);">
				Esperando al anfitrión
			</h2>
			<p class="mb-6 text-sm text-[var(--text-muted)]">El anfitrión comenzará a compartir pronto</p>
			<Button variant="secondary" onclick={onLeave}>Salir de la sala</Button>

		{:else if status === 'error'}
			<div class="glass rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
				<div class="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
					<div class="absolute inset-0 rounded-full opacity-30 blur-xl bg-[var(--danger)]"></div>
					<div class="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger)]/12">
						<AlertTriangle class="h-7 w-7 text-[var(--danger)]" />
					</div>
				</div>
				<h2 class="mb-2 text-lg font-bold text-[var(--text)]" style="font-family: var(--font-display);">Error</h2>
				<p class="mb-6 text-sm text-[var(--text-muted)]" role="alert">{errorMessage}</p>
				<Button onclick={onRetry} class="w-full">Intentar de nuevo</Button>
			</div>

		{:else if status === 'disconnected'}
			<div class="glass rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
				<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
					<WifiOff class="h-7 w-7 text-[var(--text-subtle)]" />
				</div>
				<h2 class="mb-2 text-lg font-bold text-[var(--text)]" style="font-family: var(--font-display);">Desconectado</h2>
				<p class="mb-6 text-sm text-[var(--text-muted)]">Se perdió la conexión con el servidor</p>
				<Button onclick={() => onReconnect?.()} class="w-full">Reconectar</Button>
			</div>

		{:else if status === 'reconnecting'}
			<div class="glass rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
				<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--warning)]/12">
					<Wifi class="h-7 w-7 text-[var(--warning)] animate-pulse" />
				</div>
				<h2 class="mb-2 text-lg font-bold text-[var(--text)]" style="font-family: var(--font-display);">Reconectando…</h2>
				<p class="mb-2 text-sm text-[var(--text-muted)]">Intento {reconnectAttempt} de 3</p>
				<div class="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
					<div
						class="h-1.5 rounded-full transition-all duration-500 gradient-brand"
						style:width="{Math.min((reconnectAttempt / 3) * 100, 100)}%"
					></div>
				</div>
				<Button variant="secondary" onclick={onCancel} class="w-full">Cancelar</Button>
			</div>
		{/if}
	</div>
</div>
