<script lang="ts">
	import { Monitor, Wifi, WifiOff, AlertTriangle } from 'lucide-svelte';
	import Button from './Button.svelte';
	import { t } from '$lib/i18n/index.svelte';

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

<!-- aria-live: connection-state transitions are the single most important
     async change for a viewer — screen readers must hear them. -->
<div class="flex items-center justify-center" role="status" aria-live="polite">
	<div class="w-full max-w-sm text-center">
		{#if status === 'connecting' || status === 'auth'}
			<div class="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
				<div class="absolute inset-0 rounded-2xl opacity-40 blur-xl gradient-brand" aria-hidden="true"></div>
				<div class="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
					<Wifi class="h-7 w-7 text-[var(--brand)]" aria-hidden="true" />
				</div>
			</div>
			<p class="font-medium text-[var(--text)]">
				{status === 'connecting' ? t('comp.stConnecting') : t('comp.stAuth')}
			</p>
			<p class="mt-1 text-sm text-[var(--text-muted)]">{t('comp.stAuthBody')}</p>

		{:else if status === 'waiting'}
			<div class="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
				<div class="absolute inset-0 rounded-3xl opacity-30 blur-2xl gradient-brand animate-pulse-slow" aria-hidden="true"></div>
				<div class="relative flex h-20 w-20 animate-float items-center justify-center rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
					<Monitor class="h-10 w-10 text-[var(--brand)]" aria-hidden="true" />
				</div>
			</div>
			<h2 class="mb-2 text-lg font-bold text-[var(--text)]" style="font-family: var(--font-display);">
				{t('comp.stWaiting')}
			</h2>
			<p class="mb-6 text-sm text-[var(--text-muted)]">{t('comp.stWaitingBody')}</p>
			<Button variant="secondary" onclick={onLeave}>{t('comp.stLeave')}</Button>

		{:else if status === 'error'}
			<div class="glass mx-auto rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
				<div class="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
					<div class="absolute inset-0 rounded-full opacity-30 blur-xl bg-[var(--danger)]" aria-hidden="true"></div>
					<div class="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger)]/12">
						<AlertTriangle class="h-7 w-7 text-[var(--danger)]" aria-hidden="true" />
					</div>
				</div>
				<h2 class="mb-2 text-lg font-bold text-[var(--text)]" style="font-family: var(--font-display);">{t('comp.stError')}</h2>
				<p class="mb-6 text-sm text-[var(--text-muted)]" role="alert">{errorMessage}</p>
				<button
					onclick={onRetry}
					class="gradient-brand flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-black shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
				>
					{t('comp.stRetry')}
				</button>
			</div>

		{:else if status === 'disconnected'}
			<div class="glass mx-auto rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
				<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
					<WifiOff class="h-7 w-7 text-[var(--text-subtle)]" aria-hidden="true" />
				</div>
				<h2 class="mb-2 text-lg font-bold text-[var(--text)]" style="font-family: var(--font-display);">{t('comp.stDisconnected')}</h2>
				<p class="mb-6 text-sm text-[var(--text-muted)]">{t('comp.stDisconnectedBody')}</p>
				<Button onclick={() => onReconnect?.()} class="w-full">{t('comp.stReconnect')}</Button>
			</div>

		{:else if status === 'reconnecting'}
			<div class="glass mx-auto rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
				<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--warning)]/12">
					<Wifi class="h-7 w-7 text-[var(--warning)] animate-pulse" aria-hidden="true" />
				</div>
				<h2 class="mb-2 text-lg font-bold text-[var(--text)]" style="font-family: var(--font-display);">{t('comp.stReconnecting')}</h2>
				<p class="mb-2 text-sm text-[var(--text-muted)]">{t('comp.stAttempt')} {reconnectAttempt} {t('comp.stOf')} 3</p>
				<div
					class="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={3}
					aria-valuenow={Math.min(reconnectAttempt, 3)}
					aria-label={t('comp.stReconnecting')}
				>
					<div
						class="h-1.5 rounded-full transition-[width] duration-500 gradient-brand"
						style:width="{Math.min((reconnectAttempt / 3) * 100, 100)}%"
					></div>
				</div>
				<Button variant="secondary" onclick={onCancel} class="w-full">{t('comp.stCancel')}</Button>
			</div>
		{/if}
	</div>
</div>
