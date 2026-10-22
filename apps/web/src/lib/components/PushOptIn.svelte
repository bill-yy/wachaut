<script lang="ts">
	/**
	 * Host opt-in for push notifications ("a viewer joined") — shown in the
	 * room sidebar. Hidden when unsupported. Failure messages are specific
	 * per cause (blocked permission vs browser push-service unreachable),
	 * auto-attempts on load are silent, and failures are reported to the
	 * error tracker so they show up in the admin panel.
	 */
	import { t } from '$lib/i18n/index.svelte';
	import type { DictKey } from '$lib/i18n/dict';
	import { toast } from '$lib/stores/toast.svelte';
	import { captureClientError } from '$lib/error-report';
	import { BellRing, Check, BellOff } from 'lucide-svelte';

	let { roomId }: { roomId: string } = $props();

	let state = $state<'unsupported' | 'idle' | 'working' | 'on' | 'denied'>('idle');

	/**
	 * Embedded browsers (Electron webviews like ZCode's panel, in-app
	 * browsers) have NO push service — subscribe() fails there forever.
	 * Detected once so we can hide the feature with an honest message.
	 */
	const isEmbeddedBrowser = (): boolean =>
		/ Electron\/| ZCode\/| WebView\)|; wv\)/i.test(navigator.userAgent);

	$effect(() => {
		if (typeof window === 'undefined') return;
		if (
			!('serviceWorker' in navigator) ||
			!('PushManager' in window) ||
			!('Notification' in window) ||
			isEmbeddedBrowser()
		) {
			state = 'unsupported';
			return;
		}
		if (Notification.permission === 'denied') {
			state = 'denied';
			return;
		}
		// Already granted from a previous session → resubscribe for THIS room.
		// Silent: an auto-attempt on load must never pop an error toast.
		if (Notification.permission === 'granted') {
			subscribe({ silent: true }).catch(() => {});
		}
	});

	function urlBase64ToUint8Array(base64: string): Uint8Array {
		const padding = '='.repeat((4 - (base64.length % 4)) % 4);
		const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
		return Uint8Array.from(raw, (c) => c.charCodeAt(0));
	}

	/** Human message for a subscribe() failure. */
	function failureKey(err: unknown): DictKey {
		const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
		if (Notification.permission === 'denied' || /permission/i.test(msg)) return 'push.blocked';
		if (/push service|AbortError|network/i.test(msg)) return 'push.serviceDown';
		return 'push.fail';
	}

	async function subscribe({ silent = false }: { silent?: boolean } = {}): Promise<void> {
		if (!silent) state = 'working';
		try {
			const keyRes = await fetch('/api/push/key');
			if (!keyRes.ok) throw new Error('push disabled');
			const { publicKey } = await keyRes.json();
			const reg = await navigator.serviceWorker.ready;
			// Drop any previous subscription first: a stale one from another
			// key/room makes subscribe() reject ("different applicationServerKey").
			const existing = await reg.pushManager.getSubscription();
			if (existing) await existing.unsubscribe().catch(() => {});
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
			});
			const res = await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ roomId, subscription: sub.toJSON() }),
			});
			if (!res.ok && res.status !== 204) throw new Error(`subscribe rejected (${res.status})`);
			state = 'on';
		} catch (err) {
			if (Notification.permission === 'denied') state = 'denied';
			else state = 'idle';
			// Always report (server logs + admin error panel), toast only on
			// explicit user action — never for the silent load-time attempt.
			captureClientError(new Error(`push opt-in failed: ${err instanceof Error ? err.message : String(err)}`));
			if (!silent) toast.error(t(failureKey(err)));
		}
	}

	async function enable() {
		try {
			if (typeof Notification === 'undefined') return;
			if (Notification.permission === 'denied') {
				state = 'denied';
				toast.warning(t('push.blocked'));
				return;
			}
			if (Notification.permission !== 'granted') {
				// Chrome can REJECT this promise instead of showing the prompt
				// (extension/tab-focus related) — treat as retryable with advice.
				let perm: string;
				try {
					perm = await Notification.requestPermission();
				} catch {
					toast.warning(t('push.promptBug'));
					return;
				}
				if (perm === 'denied') {
					// Chrome auto-blocks sites after repeated dismissals — from
					// here ONLY the padlock settings can re-enable them.
					state = 'denied';
					toast.warning(t('push.blocked'));
					return;
				}
				if (perm !== 'granted') return; // dismissed — keep idle, no noise
			}
			await subscribe();
		} catch {
			state = 'idle';
			toast.error(t('push.fail'));
		}
	}

	async function disable() {
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			if (sub) {
				await fetch('/api/push/unsubscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ roomId, endpoint: sub.endpoint }),
				});
				await sub.unsubscribe();
			}
		} catch { /* best effort */ }
		state = 'idle';
	}
</script>

{#if state === 'on'}
	<button
		onclick={disable}
		class="flex w-full items-center gap-2 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/8 px-3.5 py-2.5 text-xs font-medium text-[var(--success)] transition-all hover:bg-[var(--success)]/15 active:scale-[0.98]"
		title={t('push.onHint')}
	>
		<Check class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
		<span class="truncate">{t('push.on')}</span>
	</button>
{:else if state === 'denied'}
	<!-- Chrome auto-blocked notifications for the site: only the padlock can undo it. -->
	<button
		onclick={() => toast.warning(t('push.blocked'))}
		class="flex w-full items-center gap-2 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-3.5 py-2.5 text-xs font-medium text-[var(--warning)] transition-all active:scale-[0.98]"
		title={t('push.blockedHint')}
	>
		<BellOff class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
		<span class="truncate">{t('push.blockedShort')}</span>
	</button>
{:else if state === 'idle' || state === 'working'}
	<button
		onclick={enable}
		disabled={state === 'working'}
		class="flex w-full items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--border)] hover:text-[var(--text)] active:scale-[0.98] disabled:opacity-60"
		title={t('push.offHint')}
	>
		<BellRing class="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" aria-hidden="true" />
		<span class="truncate">{state === 'working' ? t('push.working') : t('push.off')}</span>
	</button>
{:else if state === 'unsupported'}
	<!-- Embedded webview (in-app browsers) — no push service exists there. -->
	<button
		onclick={() => toast.info(t('push.embedded'))}
		class="flex w-full items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-subtle)] transition-all hover:bg-[var(--border)] active:scale-[0.98]"
		title={t('push.embedded')}
	>
		<BellOff class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
		<span class="truncate">{t('push.embeddedShort')}</span>
	</button>
{/if}
