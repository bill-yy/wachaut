<script lang="ts">
	/**
	 * Host opt-in for push notifications ("a viewer joined") — shown in the
	 * room sidebar. Hidden when unsupported or permanently denied.
	 */
	import { t } from '$lib/i18n/index.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { BellRing, Check } from 'lucide-svelte';

	let { roomId }: { roomId: string } = $props();

	let state = $state<'unsupported' | 'idle' | 'working' | 'on' | 'denied'>('idle');

	$effect(() => {
		if (typeof window === 'undefined') return;
		if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
			state = 'unsupported';
			return;
		}
		// Already granted from a previous session → resubscribe for THIS room.
		if (Notification.permission === 'granted') {
			subscribe().catch(() => {});
		} else if (Notification.permission === 'denied') {
			state = 'denied';
		}
	});

	function urlBase64ToUint8Array(base64: string): Uint8Array {
		const padding = '='.repeat((4 - (base64.length % 4)) % 4);
		const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
		return Uint8Array.from(raw, (c) => c.charCodeAt(0));
	}

	async function subscribe(): Promise<void> {
		state = 'working';
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
			if (!res.ok && res.status !== 204) throw new Error('subscribe rejected');
			state = 'on';
		} catch {
			state = Notification.permission === 'denied' ? 'denied' : 'idle';
			if (Notification.permission !== 'denied') toast.error(t('push.fail'));
		}
	}

	async function enable() {
		try {
			if (typeof Notification === 'undefined') return;
			if (Notification.permission === 'denied') {
				state = 'denied';
				return;
			}
			if (Notification.permission !== 'granted') {
				// Chrome can REJECT this promise instead of showing the prompt
				// (the notorious "No Listener: tabs:outgoing.message.ready" bug,
				// usually extension/tab-focus related) — treat as retryable.
				let perm: string;
				try {
					perm = await Notification.requestPermission();
				} catch {
					toast.warning(t('push.promptBug'));
					return;
				}
				if (perm !== 'granted') {
					state = perm === 'denied' ? 'denied' : 'idle';
					return;
				}
			}
			await subscribe();
		} catch {
			// Belt and braces: no unhandled rejections from the click handler.
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
		class="flex w-full items-center gap-2 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/8 px-3 py-2 text-xs font-medium text-[var(--success)] transition-all hover:bg-[var(--success)]/15 active:scale-[0.98]"
		title={t('push.onHint')}
	>
		<Check class="h-3.5 w-3.5 shrink-0" />
		<span class="truncate">{t('push.on')}</span>
	</button>
{:else if state === 'idle' || state === 'working'}
	<button
		onclick={enable}
		disabled={state === 'working'}
		class="flex w-full items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--border)] hover:text-[var(--text)] active:scale-[0.98] disabled:opacity-60"
		title={t('push.offHint')}
	>
		<BellRing class="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
		<span class="truncate">{state === 'working' ? t('push.working') : t('push.off')}</span>
	</button>
{/if}
