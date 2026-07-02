<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/state';
	import { io } from 'socket.io-client';
	import { SfuClient } from '$lib/sfu-client';
	import {
		playHostMuted,
		playChatMessage,
		isMuted as isNotifMuted,
		setMuted as setNotifMuted,
	} from '$lib/notificationSounds';

	// Components
	import ViewerHeader from '$lib/components/ViewerHeader.svelte';
	import ViewerAuth from '$lib/components/ViewerAuth.svelte';
	import ViewerStatus from '$lib/components/ViewerStatus.svelte';
	import ViewerVideoStage from '$lib/components/ViewerVideoStage.svelte';
	import ViewerChatPanel from '$lib/components/ViewerChatPanel.svelte';
	import { MessageCircle } from 'lucide-svelte';

	// Shared utils
	import { ALL_EMOTES, loadFavorites, trackFavorite } from '$lib/utils/emotes';
	import { SENDER_SYSTEM, type ChatMessage } from '$lib/utils/chat';
	import { copyText } from '$lib/utils/clipboard';
	import { toast } from '$lib/stores/toast.svelte';
	import type { FloatingReaction } from '$lib/types/room';
	import { subscribeToPush, unsubscribePush } from '$lib/utils/push.js';

	const roomId = $derived(page.params.roomId);

	// --- Connection state ---
	type Status = 'idle' | 'connecting' | 'auth' | 'waiting' | 'live' | 'error' | 'disconnected' | 'reconnecting';
	let status = $state<Status>('idle');
	let errorMessage = $state('');
	let pin = $state('');
	let username = $state('');
	let assignedUsername = $state('');
	let reconnectAttempt = $state(0);
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	const USERNAME_STORAGE_KEY = 'wachaut.viewer.username';

	// --- Socket & SFU ---
	let socket: any = $state(null);
	let sfuClient: any = $state(null);

	// --- Video ---
	let videoEl: HTMLVideoElement | null = $state(null);
	let videoContainer: HTMLDivElement | null = $state(null);
	let isMuted = $state(true);
	let volume = $state(100);
	let isFullscreen = $state(false);
	let hostMuted = $state(false);
	// Holds a stream that arrived before the <video> element was mounted.
	let pendingStream: MediaStream | null = $state(null);

	// Attach the pending stream to the video element once it exists. This closes
	// the race where `stream-ready` fires before Svelte mounts ViewerVideoStage.
	$effect(() => {
		if (videoEl && pendingStream) {
			videoEl.srcObject = pendingStream;
			videoEl.volume = volume / 100;
			videoEl.muted = isMuted;
			videoEl.play().catch(() => {});
			pendingStream = null;
		}
	});

	// --- Chat ---
	let chatMessages = $state<ChatMessage[]>([]);
	let chatInput = $state('');

	// --- Mobile & Keyboard Shortcuts ---
	let chatOpen = $state(false);
	let showShortcuts = $state(false);
	let chatInputEl: HTMLInputElement | null = $state(null);
	let shortcutsTimeout: ReturnType<typeof setTimeout> | null = null;
	let errorClearTimer: ReturnType<typeof setTimeout> | null = null;

	// --- Connection Stats ---
	let connectionStats = $state({ resolution: '', fps: '', bitrate: '' });
	let statsInterval: ReturnType<typeof setInterval> | null = null;
	let lastBytesReceived = 0;
	let lastStatsTime = 0;

	// --- Reactions ---
	let showEmotePicker = $state(false);
	const VIEWER_FAVORITES_KEY = 'wachaut.viewer.favorites';
	let favoriteEmojis = $state<string[]>(loadFavorites(VIEWER_FAVORITES_KEY));
	let floatingReactions = $state<FloatingReaction[]>([]);
	let reactionCounter = 0;

	// --- Notifications ---
	let notificationsMuted = $state(isNotifMuted());
	let pushEnabled = $state(false);

	function toggleNotificationsMuted() {
		notificationsMuted = !notificationsMuted;
		setNotifMuted(notificationsMuted);
	}

	async function enablePush() {
		if (!socket || !roomId) return;
		const wsUrl = import.meta.env.VITE_WS_URL || 'wss://wachaut.billytech.es';
		const serverUrl = wsUrl.replace(/^wss/, 'https').replace(/^ws/, 'http');
		const subscription = await subscribeToPush(roomId, serverUrl);
		if (subscription) {
			socket.emit('push:subscribe', { roomId, subscription });
			pushEnabled = true;
		}
	}

	async function disablePush() {
		if (socket) socket.emit('push:unsubscribe');
		await unsubscribePush();
		pushEnabled = false;
	}

	function togglePush() {
		if (pushEnabled) void disablePush();
		else void enablePush();
	}

	// --- Derived ---
	let connectionQuality = $derived.by<'buena' | 'regular' | 'desconocida'>(() => {
		const res = connectionStats.resolution || '';
		if (res.includes('1920')) return 'buena';
		if (res.includes('1280')) return 'regular';
		return 'desconocida';
	});

	// --- Chat helpers ---
	function addSystemMessage(text: string) {
		chatMessages = [...chatMessages, {
			id: `system-${Date.now()}`,
			sender: SENDER_SYSTEM,
			text,
			timestamp: new Date(),
		}];
	}

	function sendChatMessage() {
		const text = chatInput.trim();
		if (!text || !socket) return;

		if (text.startsWith('/')) {
			const parts = text.split(/\s+/);
			const command = parts[0].toLowerCase();
			if (command === '/help') {
				addSystemMessage('Comandos: /help, /stats, /clear');
				chatInput = '';
				return;
			} else if (command === '/stats') {
				addSystemMessage(`Estado: ${status} | Resolución: ${connectionStats.resolution || 'N/A'} | FPS: ${connectionStats.fps || 'N/A'} | Bitrate: ${connectionStats.bitrate || 'N/A'}`);
				chatInput = '';
				return;
			} else if (command === '/clear') {
				chatMessages = [];
				addSystemMessage('Chat limpiado.');
				chatInput = '';
				return;
			}
		}

		socket.emit('chat:message', { text });
		chatInput = '';
	}

	// --- Reactions ---
	function addFloatingReaction(emoji: string) {
		if (!ALL_EMOTES.includes(emoji)) return;
		const id = ++reactionCounter;
		const idx = reactionCounter % 4;
		const scales = [1.4, 1.8, 2.2, 1.6];
		const bottoms = [40, 120, 200, 80];
		const xOffsets = ['0px', '-20px', '15px', '-10px'];
		const rotations = ['-12deg', '8deg', '-5deg', '15deg'];
		const reaction: FloatingReaction = {
			id, emoji,
			x: Math.random() * 70 + 10,
			bottom: bottoms[idx],
			fontSize: scales[idx],
			xOffset: xOffsets[idx],
			rotation: rotations[idx],
			delay: Math.random() * 0.2,
			duration: 2.5 + Math.random() * 1,
			createdAt: Date.now(),
		};
		floatingReactions = [...floatingReactions, reaction];
		setTimeout(() => {
			floatingReactions = floatingReactions.filter((r) => r.id !== id);
		}, (reaction.duration + reaction.delay) * 1000 + 200);
	}

	function sendReaction(emoji: string) {
		if (!socket || !ALL_EMOTES.includes(emoji)) return;
		favoriteEmojis = trackFavorite(VIEWER_FAVORITES_KEY, favoriteEmojis, emoji);
		showEmotePicker = false;
		addFloatingReaction(emoji);
		socket.emit('reaction:send', { emoji });
	}

	// --- Functions ---
	async function connect() {
		cleanupSocket();
		sfuClient?.disconnect();
		sfuClient = null;

		const cleanedUsername = sanitizeUsername(username);
		username = cleanedUsername;

		if (cleanedUsername.length < 2) {
			errorMessage = 'Ingresa un username de al menos 2 caracteres';
			status = 'error';
			return;
		}

		if (!pin || pin.length < 4) {
			errorMessage = 'Ingresa un PIN válido';
			status = 'error';
			return;
		}

		status = 'connecting';

		const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
		socket = io(wsUrl, { transports: ['websocket'] });

		socket.on('connect', () => {
			socket.emit('viewer:join', { roomId, pin, username: cleanedUsername });
			status = 'auth';
		});

		socket.on('room:auth-success', () => {
			status = 'waiting';
		});

		socket.on('room:auth-failed', (data: any) => {
			errorMessage = data?.message || 'PIN incorrecto';
			status = 'error';
			cleanupSocket();
		});

		socket.on('room:error', (data: any) => {
			errorMessage = data?.message || 'Error en la sala';
			status = 'error';
			cleanupSocket();
		});

		socket.on('room:joined', (data: any) => {
			assignedUsername = data?.username || cleanedUsername;
			username = assignedUsername;
			saveUsername(assignedUsername);
			status = 'waiting';
			connectSfu(assignedUsername);
			void enablePush();
		});

		socket.on('chat:history', (data: any) => {
			if (data?.messages) {
				chatMessages = data.messages.map((msg: any) => ({
					id: msg.id || Date.now() + Math.random(),
					sender: msg.sender || 'Anónimo',
					text: msg.text,
					timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
				}));
			}
		});

		socket.on('chat:message', (msg: any) => {
			chatMessages = [
				...chatMessages,
				{
					id: msg.id || Date.now(),
					sender: msg.sender || 'Anónimo',
					text: msg.text,
					timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
				},
			];
			try { playChatMessage(); } catch {}
		});

		socket.on('reaction:receive', (data: any) => addFloatingReaction(data.emoji));

		socket.on('host:stopped-sharing', () => {
			sfuClient?.disconnect();
			sfuClient = null;
			stopStatsPolling();
			if (videoEl) videoEl.srcObject = null;
			status = 'waiting';
		});

		socket.on('host:muted', () => {
			hostMuted = true;
			try { playHostMuted(); } catch {}
		});

		socket.on('host:unmuted', () => { hostMuted = false; });

		socket.on('viewer:kicked', (data: any) => {
			errorMessage = data?.reason || 'Has sido expulsado de la sala';
			status = 'error';
			cleanupSocket();
		});

		socket.on('host:disconnected', () => {
			errorMessage = 'El anfitrión se desconectó';
			status = 'error';
			sfuClient?.disconnect();
			sfuClient = null;
			stopStatsPolling();
		});

		socket.on('room:closed', () => {
			errorMessage = 'La sala se cerró';
			status = 'error';
			sfuClient?.disconnect();
			sfuClient = null;
			stopStatsPolling();
		});

		socket.on('disconnect', () => {
			if (status !== 'error') {
				// Tear down the SFU + stats so we don't leak a dangling recv transport.
				sfuClient?.disconnect();
				sfuClient = null;
				stopStatsPolling();
				status = 'disconnected';
				scheduleReconnect();
			}
		});
	}

	function disconnect() {
		stopStatsPolling();
		cleanupReconnect();
		sfuClient?.disconnect();
		sfuClient = null;
		cleanupSocket();
		void disablePush();
		if (videoEl) videoEl.srcObject = null;
		status = 'idle';
		pin = '';
		assignedUsername = '';
		chatMessages = [];
		errorMessage = '';
		connectionStats = { resolution: '', fps: '', bitrate: '' };
	}

	function cleanupSocket() {
		if (socket) {
			socket.removeAllListeners();
			socket.disconnect();
			socket = null;
		}
	}

	function scheduleReconnect() {
		if (reconnectAttempt >= 3) {
			status = 'error';
			errorMessage = 'No se pudo reconectar. Intenta de nuevo.';
			reconnectAttempt = 0;
			return;
		}
		const delay = Math.min(2000 * Math.pow(2, reconnectAttempt), 8000);
		reconnectAttempt++;
		if (reconnectTimer) clearTimeout(reconnectTimer);
		reconnectTimer = setTimeout(() => {
			connect().catch(() => {});
		}, delay);
	}

	function cleanupReconnect() {
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
		reconnectAttempt = 0;
	}

	function sanitizeUsername(value: string): string {
		return value
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^a-zA-Z0-9_-]/g, '')
			.slice(0, 24);
	}

	function saveUsername(value: string) {
		try { localStorage.setItem(USERNAME_STORAGE_KEY, value); } catch {}
	}

	function retry() {
		cleanupReconnect();
		status = 'idle';
		errorMessage = '';
	}

	// --- Video controls ---
	function toggleMute() {
		if (!videoEl) return;
		if (videoEl.muted && volume === 0) {
			volume = 50;
			videoEl.volume = 0.5;
		}
		videoEl.muted = !videoEl.muted;
		isMuted = videoEl.muted;
	}

	function handleVolumeChange(v: number) {
		volume = v;
		if (videoEl) {
			videoEl.volume = v / 100;
			videoEl.muted = v === 0;
			isMuted = videoEl.muted;
		}
	}

	function toggleFullscreen() {
		if (!videoContainer) return;
		if (!document.fullscreenElement) {
			videoContainer.requestFullscreen().then(() => { isFullscreen = true; }).catch(() => {});
		} else {
			document.exitFullscreen().then(() => { isFullscreen = false; }).catch(() => {});
		}
	}

	function onVideoClick() {
		if (videoEl) {
			videoEl.muted = false;
			isMuted = false;
		}
	}

	async function shareLink() {
		const url = `${window.location.origin}/room/${roomId}`;
		try {
			if (navigator.share) {
				await navigator.share({ title: 'Wachaut — Únete a mi pantalla', url });
			} else {
				const ok = await copyText(url);
				if (ok) toast.success('Enlace copiado');
			}
		} catch {
			/* user cancelled share */
		}
	}

	// --- SFU ---
	async function connectSfu(displayName: string) {
		if (sfuClient) return;
		try {
			const sfuUrl = import.meta.env.VITE_SFU_URL || 'wss://sfu-wachaut.billytech.es';
			sfuClient = new SfuClient(sfuUrl);

			sfuClient.on('stream-ready', (stream: MediaStream) => {
				status = 'live';
				reconnectAttempt = 0;
				// Hand off to the $effect above, which attaches once videoEl exists.
				pendingStream = stream;
				startStatsPolling();
				showShortcutsOverlay();
				if (window.innerWidth < 768) chatOpen = true;
			});

			sfuClient.on('error', (msg: string) => {
				errorMessage = msg;
				if (errorClearTimer) clearTimeout(errorClearTimer);
				errorClearTimer = setTimeout(() => { errorMessage = ''; }, 5000);
			});

			sfuClient.on('disconnected', () => {
				if (status === 'live') status = 'reconnecting';
			});

			await sfuClient.joinRoom(roomId, pin, displayName, 'viewer');
			await sfuClient.consume();
		} catch {
			errorMessage = 'No se pudo conectar al SFU. La calidad puede ser reducida.';
			if (errorClearTimer) clearTimeout(errorClearTimer);
			errorClearTimer = setTimeout(() => { errorMessage = ''; }, 8000);
		}
	}

	async function updateStats() {
		if (!sfuClient || status !== 'live') return;
		try {
			const stats = await sfuClient.getStats();
			if (!stats) return;
			// Build the new values in locals, then reassign once to avoid
			// triggering 3 separate reactive notifications per poll tick.
			let resolution = connectionStats.resolution;
			let fps = connectionStats.fps;
			let bitrate = connectionStats.bitrate;

			for (const report of stats as any[]) {
				if (report.type === 'inbound-rtp' && report.kind === 'video') {
					resolution = `${report.frameWidth || '?'}×${report.frameHeight || '?'}`;
					fps = `${report.framesPerSecond || '?'}`;
					const now = Date.now();
					const bytesReceived = report.bytesReceived || 0;
					if (lastStatsTime > 0) {
						const elapsed = (now - lastStatsTime) / 1000;
						const deltaBytes = bytesReceived - lastBytesReceived;
						const bps = (deltaBytes * 8) / elapsed;
						if (bps >= 1000000) bitrate = `${(bps / 1000000).toFixed(1)} Mbps`;
						else if (bps >= 1000) bitrate = `${(bps / 1000).toFixed(0)} Kbps`;
						else bitrate = `${Math.round(bps)} bps`;
					}
					lastBytesReceived = bytesReceived;
					lastStatsTime = now;
					break; // only the first video inbound-rtp report matters
				}
			}

			// Only trigger reactivity if something actually changed.
			if (resolution !== connectionStats.resolution || fps !== connectionStats.fps || bitrate !== connectionStats.bitrate) {
				connectionStats = { resolution, fps, bitrate };
			}
		} catch {}
	}

	function startStatsPolling() {
		stopStatsPolling();
		lastBytesReceived = 0;
		lastStatsTime = 0;
		connectionStats = { resolution: '', fps: '', bitrate: '' };
		// Poll every 5s (was 3s) — resolution/fps rarely change, reduces getStats overhead.
		statsInterval = setInterval(updateStats, 5000);
	}

	function stopStatsPolling() {
		if (statsInterval) {
			clearInterval(statsInterval);
			statsInterval = null;
		}
	}

	// --- Keyboard Shortcuts ---
	function showShortcutsOverlay() {
		showShortcuts = true;
		if (shortcutsTimeout) clearTimeout(shortcutsTimeout);
		shortcutsTimeout = setTimeout(() => { showShortcuts = false; }, 3000);
	}

	function handleKeydown(e: KeyboardEvent) {
		const tag = document.activeElement?.tagName;
		const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

		if (e.key === '/' && !isInput && status === 'live') {
			e.preventDefault();
			chatInputEl?.focus();
			return;
		}

		if (isInput) return;
		if (status !== 'live') return;

		switch (e.key.toLowerCase()) {
			case 'm': e.preventDefault(); toggleMute(); break;
			case 'f': e.preventDefault(); toggleFullscreen(); break;
			case 'escape':
				if (document.fullscreenElement) {
					document.exitFullscreen().catch(() => {});
					isFullscreen = false;
				}
				break;
		}
	}

	function handleVisibilityChange() {
		if (document.hidden) {
			stopStatsPolling();
		} else if (status === 'live') {
			startStatsPolling();
		}
	}

	function toggleChat() {
		chatOpen = !chatOpen;
		if (chatOpen) seenCount = chatMessages.filter((m) => m.sender !== SENDER_SYSTEM).length;
	}

	// Count only messages that arrived while the chat drawer was closed.
	let seenCount = $state(0);
	let unreadCount = $derived.by(() => {
		const nonSystem = chatMessages.filter((m) => m.sender !== SENDER_SYSTEM).length;
		return chatOpen ? 0 : Math.max(0, nonSystem - seenCount);
	});

	function handleFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;
	}

	onDestroy(() => {
		if (shortcutsTimeout) clearTimeout(shortcutsTimeout);
		if (errorClearTimer) clearTimeout(errorClearTimer);
		stopStatsPolling();
		cleanupReconnect();
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		document.removeEventListener('fullscreenchange', handleFullscreenChange);
		disconnect();
	});

	onMount(() => {
		try { username = localStorage.getItem(USERNAME_STORAGE_KEY) || ''; } catch { username = ''; }
		document.addEventListener('visibilitychange', handleVisibilityChange);
		document.addEventListener('fullscreenchange', handleFullscreenChange);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-app">
	{#if status !== 'live'}
		<!-- Non-live states -->
		<ViewerHeader notificationsMuted={notificationsMuted} onToggleNotifications={toggleNotificationsMuted} />

		<!-- Ambient background -->
		<div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
			<div
				class="absolute left-1/2 top-1/4 h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
				style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"
			></div>
		</div>

		<main class="mx-auto max-w-5xl px-4 py-6">
			{#if status === 'idle'}
				<div class="flex items-center justify-center" style="min-height: 60vh;">
					<ViewerAuth bind:username bind:pin onConnect={connect} />
				</div>
			{:else}
				<ViewerStatus
					status={status as 'connecting' | 'auth' | 'waiting' | 'error' | 'disconnected' | 'reconnecting'}
					{errorMessage}
					{reconnectAttempt}
					onRetry={retry}
					onReconnect={() => connect()}
					onCancel={() => { cleanupReconnect(); disconnect(); }}
					onLeave={disconnect}
				/>
			{/if}
		</main>
	{:else}
		<!-- LIVE layout -->
		<div class="flex h-screen flex-col overflow-hidden md:flex-row">
			<!-- Video -->
			<ViewerVideoStage
				muted={isMuted}
				{volume}
				fullscreen={isFullscreen}
				{hostMuted}
				assignedUsername={assignedUsername}
				reactions={floatingReactions}
				onVideoMount={(el) => (videoEl = el)}
				onContainerMount={(el) => (videoContainer = el)}
				onToggleMute={toggleMute}
				onVolumeChange={handleVolumeChange}
				onToggleFullscreen={toggleFullscreen}
				onShare={shareLink}
				onShowShortcuts={showShortcutsOverlay}
				onVideoClick={onVideoClick}
			/>

			<!-- Chat sidebar (desktop: static; mobile: drawer driven by `open`) -->
			<ViewerChatPanel
				open={chatOpen}
				messages={chatMessages}
				bind:value={chatInput}
				{notificationsMuted}
				{pushEnabled}
				{connectionStats}
				{connectionQuality}
				{favoriteEmojis}
				{showEmotePicker}
				onSend={sendChatMessage}
				onToggleNotifications={toggleNotificationsMuted}
				onTogglePush={togglePush}
				onSendReaction={sendReaction}
				onToggleEmotePicker={() => (showEmotePicker = !showEmotePicker)}
				onCloseEmotePicker={() => (showEmotePicker = false)}
			/>

			<!-- Mobile chat toggle (FAB) -->
			<button
				onclick={toggleChat}
				class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all hover:brightness-110 active:scale-95 md:hidden gradient-brand"
				title={chatOpen ? 'Cerrar chat' : 'Abrir chat'}
				aria-label={chatOpen ? 'Cerrar chat' : 'Abrir chat'}
			>
				<MessageCircle class="h-6 w-6" />
				{#if unreadCount > 0}
					<span class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-xs font-bold text-white">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				{/if}
			</button>

			<!-- Mobile backdrop -->
			{#if chatOpen}
				<button
					class="fixed inset-0 z-40 bg-black/50 md:hidden"
					onclick={toggleChat}
					aria-label="Cerrar chat"
					tabindex="-1"
				></button>
			{/if}

			<!-- Shortcuts overlay -->
			{#if showShortcuts}
				<div class="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-fade-in md:bottom-6">
					<div class="glass flex items-center gap-4 rounded-xl px-4 py-2.5 text-xs text-[var(--text-muted)] shadow-xl">
						<span><kbd class="font-mono font-semibold text-[var(--text)]">M</kbd> silenciar</span>
						<span><kbd class="font-mono font-semibold text-[var(--text)]">F</kbd> pantalla completa</span>
						<span><kbd class="font-mono font-semibold text-[var(--text)]">/</kbd> chat</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
