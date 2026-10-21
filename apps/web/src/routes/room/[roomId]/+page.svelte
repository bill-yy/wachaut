<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/state';
	import { io } from 'socket.io-client';
	import { SfuClient } from '$lib/sfu-client';
	import { reconnectDelayForAttempt, shouldGiveUpReconnect } from '$lib/reconnect-strategy';
	import { captureClientError } from '$lib/error-report';
	import { buildDiagnosticsReport, icePathLabel } from '$lib/diagnostics';
	import { t, srv, i18n } from '$lib/i18n/index.svelte';
	import { hasRated } from '$lib/feedback';
	import RatingCard from '$lib/components/RatingCard.svelte';
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

	const roomId = $derived(page.params.roomId);

	// --- Connection state ---
	type Status = 'idle' | 'connecting' | 'auth' | 'waiting' | 'live' | 'ended' | 'error' | 'disconnected' | 'reconnecting';
	let status = $state<Status>('idle');
	let errorMessage = $state('');
	/** Public room title shown on the join screen (from /api/room-info). */
	let roomTitle = $state('');
	let pin = $state('');
	let username = $state('');
	let assignedUsername = $state('');
	let reconnectAttempt = $state(0);
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	// Viewer-side watchdog that fires if the host doesn't reclaim within the
	// grace window after a `host:disconnected` event.
	let hostReconnectTimer: ReturnType<typeof setTimeout> | null = null;
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
	let autoConnectTimer: ReturnType<typeof setTimeout> | null = null;

	// --- Connection Stats ---
	let connectionStats = $state({ resolution: '', fps: '', bitrate: '', lossRate: 0, jitter: 0, rtt: 0, decoder: '', icePath: '' });
	let statsInterval: ReturnType<typeof setInterval> | null = null;
	let lastBytesReceived = 0;
	let lastStatsTime = 0;
	let lastPacketsLost = 0;
	let lastPacketsReceived = 0;

	// --- Reactions ---
	let showEmotePicker = $state(false);
	const VIEWER_FAVORITES_KEY = 'wachaut.viewer.favorites';
	let favoriteEmojis = $state<string[]>(loadFavorites(VIEWER_FAVORITES_KEY));
	let floatingReactions = $state<FloatingReaction[]>([]);
	let reactionCounter = 0;

	// --- Notifications ---
	let notificationsMuted = $state(isNotifMuted());
	function toggleNotificationsMuted() {
		notificationsMuted = !notificationsMuted;
		setNotifMuted(notificationsMuted);
	}

	// --- Pre-connection quality hint (measured before joining) ---
	let preConnRttMs = $state<number | null>(null);
	let preConnQuality = $derived.by<'good' | 'ok' | 'poor' | 'unknown'>(() => {
		if (preConnRttMs == null) return 'unknown';
		if (preConnRttMs < 100) return 'good';
		if (preConnRttMs < 250) return 'ok';
		return 'poor';
	});

	async function measurePreConnection() {
		try {
			const samples: number[] = [];
			for (let i = 0; i < 2; i++) {
				const t0 = performance.now();
				await fetch('/api/status', { method: 'HEAD', cache: 'no-store' });
				samples.push(performance.now() - t0);
			}
			preConnRttMs = Math.round(Math.min(...samples));
		} catch { /* hint stays unknown — never block joining */ }
	}

	// --- Derived ---
	// Quality is derived from real packet loss and jitter, not resolution.
	// A 1080p stream at 20% loss is worse than a 720p stream at 0% loss.
	let connectionQuality = $derived.by<'buena' | 'regular' | 'desconocida'>(() => {
		const loss = connectionStats.lossRate;
		const jitter = connectionStats.jitter;
		if (loss === 0 && jitter === 0 && !connectionStats.resolution) return 'desconocida';
		if (loss > 0.05 || jitter > 150) return 'desconocida';
		if (loss > 0.02 || jitter > 80) return 'regular';
		return 'buena';
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

	/** Copy a full diagnostics report (stats + network path) to the clipboard. */
	async function copyDiagnostics() {
		const report = buildDiagnosticsReport('viewer', {
			rol: 'viewer',
			estado: status,
			calidad: connectionQuality,
			resolución: connectionStats.resolution || '—',
			fps: connectionStats.fps || '—',
			bitrate: connectionStats.bitrate || '—',
			pérdida: connectionStats.lossRate ? `${(connectionStats.lossRate * 100).toFixed(1)}%` : '0%',
			jitter: `${connectionStats.jitter} ms`,
			rtt: connectionStats.rtt ? `${connectionStats.rtt} ms` : '—',
			decoder: connectionStats.decoder || '—',
			ruta_ice: connectionStats.icePath || '—',
		});
		try {
			await copyText(report);
			addSystemMessage(t('room.diagCopied'));
		} catch {
			addSystemMessage(report.replace(/\n/g, ' · '));
		}
	}

	function sendChatMessage() {
		const text = chatInput.trim();
		if (!text || !socket) return;

		if (text.startsWith('/')) {
			const parts = text.split(/\s+/);
			const command = parts[0].toLowerCase();
			if (command === '/help') {
				addSystemMessage(t('room.cmdHelpShort'));
				chatInput = '';
				return;
			} else if (command === '/stats') {
				addSystemMessage(t('room.cmdStatsViewer', { status, resolution: connectionStats.resolution || 'N/A', fps: connectionStats.fps || 'N/A', bitrate: connectionStats.bitrate || 'N/A' }));
				void copyDiagnostics();
				chatInput = '';
				return;
			} else if (command === '/clear') {
				chatMessages = [];
				addSystemMessage(t('room.cmdCleared'));
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
			errorMessage = t('comp.vauthNameShort');
			status = 'error';
			return;
		}

		if (!pin || pin.length < 4) {
			errorMessage = t('vroom.invalidPin');
			status = 'error';
			return;
		}

		status = 'connecting';

		const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
		socket = io(wsUrl, { transports: ['websocket'] });

		socket.on('connect', () => {
			// On reconnect, prefer the server-assigned username from the
			// previous successful join so the viewer keeps a stable identity
			// instead of being re-reserved as "name-2", "name-3", etc.
			const user = assignedUsername || cleanedUsername;
			socket.emit('viewer:join', { roomId, pin, username: user });
			status = 'auth';
		});

		socket.on('room:auth-success', () => {
			status = 'waiting';
		});

		socket.on('room:auth-failed', (data: any) => {
			errorMessage = srv(data?.message) || t('comp.vauthWrongPin');
			status = 'error';
			cleanupSocket();
		});

		socket.on('room:error', (data: any) => {
			errorMessage = srv(data?.message) || t('vroom.genericError');
			status = 'error';
			cleanupSocket();
		});

		socket.on('room:joined', (data: any) => {
			assignedUsername = data?.username || cleanedUsername;
			username = assignedUsername;
			saveUsername(assignedUsername);
			// Successful (re)join — reset the backoff so the next disconnect
			// starts fresh.
			reconnectAttempt = 0;
			if (hostReconnectTimer) { clearTimeout(hostReconnectTimer); hostReconnectTimer = null; }
			status = 'waiting';
			connectSfu(assignedUsername);
		});

		socket.on('chat:history', (data: any) => {
			if (data?.messages) {
				chatMessages = data.messages.map((msg: any) => ({
					id: msg.id || Date.now() + Math.random(),
					sender: msg.sender || t('vroom.anon'),
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
					sender: msg.sender || t('vroom.anon'),
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
			errorMessage = srv(data?.reason) || t('vroom.kicked');
			status = 'error';
			cleanupSocket();
		});

		socket.on('host:disconnected', () => {
			// The host dropped but may reclaim within the grace window. Enter
			// a "reconnecting" state instead of hard-erroring so the viewer
			// auto-resumes when the host comes back (host:reconnected event).
			// Only escalate to error if we don't hear back within the grace
			// window plus a safety margin.
			errorMessage = t('vroom.hostReconnecting');
			status = 'reconnecting';
			if (hostReconnectTimer) clearTimeout(hostReconnectTimer);
			// HOST_RECONNECT_GRACE_MS on the server is 30s; give a 45s ceiling
			// here so the viewer doesn't give up before the server does.
			hostReconnectTimer = setTimeout(() => {
				if (status === 'reconnecting') {
					errorMessage = t('vroom.hostLost');
					status = 'error';
					sfuClient?.disconnect();
					sfuClient = null;
					stopStatsPolling();
				}
			}, 45000);
		});

		// Host came back after a transient drop — exit reconnecting state and
		// re-attach to the SFU so media resumes.
		socket.on('host:reconnected', () => {
			if (hostReconnectTimer) { clearTimeout(hostReconnectTimer); hostReconnectTimer = null; }
			if (status === 'reconnecting') {
				errorMessage = '';
				status = 'live';
				// The SFU preserved our consumers; nothing to do here unless
				// the recv transport died, in which case the next check kicks in.
			}
		});

		socket.on('room:title', (data: any) => {
			roomTitle = data?.title || '';
		});

		socket.on('room:closed', () => {
			if (hostReconnectTimer) { clearTimeout(hostReconnectTimer); hostReconnectTimer = null; }
			// The broadcast ended — dedicated screen with a rating prompt
			// instead of the generic error state.
			status = 'ended';
			errorMessage = '';
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
		if (hostReconnectTimer) { clearTimeout(hostReconnectTimer); hostReconnectTimer = null; }
		sfuClient?.disconnect();
		sfuClient = null;
		cleanupSocket();
		if (videoEl) videoEl.srcObject = null;
		status = 'idle';
		pin = '';
		assignedUsername = '';
		chatMessages = [];
		errorMessage = '';
		connectionStats = { resolution: '', fps: '', bitrate: '', lossRate: 0, jitter: 0, rtt: 0, decoder: '', icePath: '' };
	}

	function cleanupSocket() {
		if (socket) {
			socket.removeAllListeners();
			socket.disconnect();
			socket = null;
		}
	}

	function scheduleReconnect() {
		if (shouldGiveUpReconnect(reconnectAttempt)) {
			status = 'error';
			errorMessage = t('vroom.reconnectFail');
			// The viewer exhausted all 8 reconnect attempts — a real
			// reliability signal for the error tracker.
			captureClientError(new Error(t('vroom.giveup')), {
				component: 'viewer.reconnect-giveup',
				roomId,
				severity: 'warning',
			});
			reconnectAttempt = 0;
			return;
		}
		const delay = reconnectDelayForAttempt(reconnectAttempt);
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
		// Include the PIN in the hash so the recipient doesn't need to type it.
		const url = pin
			? `${window.location.origin}/room/${roomId}#${pin}`
			: `${window.location.origin}/room/${roomId}`;
		try {
			if (navigator.share) {
				await navigator.share({ title: i18n.locale === 'en' ? t('vroom.titleEn') : t('vroom.title'), url });
			} else {
				const ok = await copyText(url);
				if (ok) toast.success(t('room.linkCopied'));
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
		} catch (err) {
			// This error object was previously discarded — the single biggest
			// blind spot for viewer-side failures.
			captureClientError(err, { component: 'viewer.connectSfu', roomId });
			errorMessage = t('vroom.sfuFail');
			if (errorClearTimer) clearTimeout(errorClearTimer);
			errorClearTimer = setTimeout(() => { errorMessage = ''; }, 8000);
		}
	}

	async function updateStats() {
		if (!sfuClient || status !== 'live') return;
		try {
			const stats = await sfuClient.getStats();
			if (!stats) return;
			let resolution = connectionStats.resolution;
			let fps = connectionStats.fps;
			let bitrate = connectionStats.bitrate;
			let lossRate = 0;
			let jitter = 0;
			let rtt = connectionStats.rtt;
			let decoder = connectionStats.decoder;
			let icePath = connectionStats.icePath;
			let nominatedPairId: string | null = null;

			for (const report of stats as any[]) {
				// Selected candidate pair → RTT + the local candidate id it rides on
				// (resolved to a relay/direct label by the local-candidate reports).
				if (report.type === 'candidate-pair' && (report.nominated || report.selected === true) && report.state === 'succeeded') {
					nominatedPairId = report.localCandidateId || null;
					rtt = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : rtt;
				}
				if (report.type === 'local-candidate' && nominatedPairId !== null && report.id === nominatedPairId) {
					icePath = icePathLabel(report.candidateType);
				}
				if (report.type === 'inbound-rtp' && report.kind === 'video') {
					resolution = `${report.frameWidth || '?'}×${report.frameHeight || '?'}`;
					fps = `${report.framesPerSecond || '?'}`;
					jitter = report.jitter ? Math.round(report.jitter * 1000) : 0; // ms
					decoder = report.decoderImplementation || decoder;
					const now = Date.now();
					const bytesReceived = report.bytesReceived || 0;
					const packetsLost = report.packetsLost || 0;
					const packetsReceived = report.packetsReceived || 0;
					if (lastStatsTime > 0) {
						const elapsed = (now - lastStatsTime) / 1000;
						const deltaBytes = bytesReceived - lastBytesReceived;
						const bps = (deltaBytes * 8) / elapsed;
						if (bps >= 1000000) bitrate = `${(bps / 1000000).toFixed(1)} Mbps`;
						else if (bps >= 1000) bitrate = `${(bps / 1000).toFixed(0)} Kbps`;
						else bitrate = `${Math.round(bps)} bps`;
						// Delta loss rate (since last poll, not cumulative)
						const deltaLost = Math.max(0, packetsLost - lastPacketsLost);
						const deltaRecv = Math.max(0, packetsReceived - lastPacketsReceived);
						lossRate = deltaRecv > 0 ? deltaLost / (deltaLost + deltaRecv) : 0;
					}
					lastBytesReceived = bytesReceived;
					lastStatsTime = now;
					lastPacketsLost = packetsLost;
					lastPacketsReceived = packetsReceived;
				}
			}

			if (resolution !== connectionStats.resolution || fps !== connectionStats.fps || bitrate !== connectionStats.bitrate || lossRate !== connectionStats.lossRate || jitter !== connectionStats.jitter || rtt !== connectionStats.rtt || decoder !== connectionStats.decoder || icePath !== connectionStats.icePath) {
				connectionStats = { resolution, fps, bitrate, lossRate, jitter, rtt, decoder, icePath };
			}
		} catch {}
	}

	function startStatsPolling() {
		stopStatsPolling();
		lastBytesReceived = 0;
		lastStatsTime = 0;
		lastPacketsLost = 0;
		lastPacketsReceived = 0;
		connectionStats = { resolution: '', fps: '', bitrate: '', lossRate: 0, jitter: 0, rtt: 0, decoder: '', icePath: '' };
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
		if (autoConnectTimer) clearTimeout(autoConnectTimer);
		stopStatsPolling();
		cleanupReconnect();
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		document.removeEventListener('fullscreenchange', handleFullscreenChange);
		disconnect();
	});

	onMount(() => {
		// Public room info → title for the join screen (also used by share previews server-side).
		fetch(`/api/room-info/${encodeURIComponent(roomId)}`).then((r) => (r.ok ? r.json() : null)).then((info) => {
			if (info?.title) roomTitle = info.title;
		}).catch(() => {});

		// Pre-connection hint: best-of-2 HEAD round-trips to the same origin
		// (through the CDN) — cheap and honest enough to set expectations
		// before the user commits to joining.
		void measurePreConnection();

		try { username = localStorage.getItem(USERNAME_STORAGE_KEY) || ''; } catch { username = ''; }
		document.addEventListener('visibilitychange', handleVisibilityChange);
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		// If the PIN is embedded in the URL hash (e.g. /room/abc#123456), pre-fill it.
		// The hash is never sent to the server, preserving PIN security.
		const hashPin = window.location.hash.replace('#', '').trim();
		if (hashPin && /^\d{4,6}$/.test(hashPin)) {
			pin = hashPin;
			// Auto-connect if we already have a saved username (skip the auth screen entirely).
			if (username.trim().length >= 2) {
				autoConnectTimer = setTimeout(() => connect(), 100);
			}
		}
	});
</script>

<svelte:head>
	<title>{t('room.viewerPageTitle')}</title>
	<!-- Ephemeral private broadcast pages must never be indexed. -->
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-app">
	{#if status !== 'live'}
		<!-- Non-live states -->
		<ViewerHeader notificationsMuted={notificationsMuted} onToggleNotifications={toggleNotificationsMuted} />

		<!-- Ambient background: the radial gradient is soft by itself — a live
		     blur(120px) here killed iOS tabs (compositor memory) once the
		     keyboard opened, so no filter is applied. -->
		<div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
			<div
				class="absolute left-1/2 top-1/4 h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-30"
				style="background: radial-gradient(circle, var(--color-amber-500), transparent 70%);"
			></div>
		</div>

		<main class="mx-auto max-w-5xl px-4 py-6">
			{#if status === 'idle'}
				<div class="flex items-center justify-center" style="min-height: 60vh;">
					{#if roomTitle}
							<p class="mb-4 max-w-sm text-center text-sm font-semibold text-[var(--brand)]" style="font-family: var(--font-display);">{roomTitle}</p>
						{/if}
						<ViewerAuth bind:username bind:pin onConnect={connect} />
						{#if preConnQuality !== 'unknown'}
							<p class="mt-2 flex items-center justify-center gap-1.5 text-xs text-[var(--text-subtle)]">
								<span
									class="inline-block h-2 w-2 rounded-full {preConnQuality === 'good' ? 'bg-[var(--success)]' : preConnQuality === 'ok' ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'}"
									aria-hidden="true"
								></span>
								{t('viewer.preConnLabel')}:
								{t(preConnQuality === 'good' ? 'viewer.preConnGood' : preConnQuality === 'ok' ? 'viewer.preConnOk' : 'viewer.preConnPoor')}
								<span class="font-mono">({preConnRttMs}ms)</span>
							</p>
						{/if}
				</div>
			{:else if status === 'ended'}
				<!-- Broadcast ended: dedicated screen with a rating prompt -->
				<div class="flex flex-col items-center justify-center gap-6 py-10" style="min-height: 60vh;">
					<div class="text-center">
						<h1 class="mb-2 text-2xl font-bold text-[var(--text)]">{t('vroom.ended')}</h1>
						<p class="text-sm text-[var(--text-muted)]">{t('vroom.endedThanks')}</p>
					</div>
					{#if !hasRated(roomId)}
						<RatingCard roomId={roomId} role="viewer" onDone={() => {}} />
					{/if}
					<a href="/" class="btn-secondary">{t('vroom.backHome')}</a>
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
				{connectionStats}
				{connectionQuality}
				{favoriteEmojis}
				{showEmotePicker}
				onSend={sendChatMessage}
				onToggleNotifications={toggleNotificationsMuted}
				onSendReaction={sendReaction}
				onToggleEmotePicker={() => (showEmotePicker = !showEmotePicker)}
				onCloseEmotePicker={() => (showEmotePicker = false)}
			/>

			<!-- Mobile chat toggle (FAB) -->
			<button
				onclick={toggleChat}
				class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all hover:brightness-110 active:scale-95 md:hidden gradient-brand"
				title={chatOpen ? t('room.closeChat') : t('room.openChat')}
				aria-label={chatOpen ? t('room.closeChat') : t('room.openChat')}
			>
				<MessageCircle class="h-6 w-6" />
				{#if unreadCount > 0}
					<span class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-xs font-bold text-white">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				{/if}
			</button>

			<!-- Mobile backdrop (no backdrop-filter: iOS compositor) -->
			{#if chatOpen}
				<button
					class="fixed inset-0 z-40 bg-black/60 md:hidden"
					onclick={toggleChat}
					aria-label={t('room.closeChat')}
					tabindex="-1"
				></button>
			{/if}

			<!-- Shortcuts overlay -->
			{#if showShortcuts}
				<div class="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-fade-in md:bottom-8">
					<div class="glass flex max-w-[90vw] flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-[var(--text-muted)] shadow-xl sm:max-w-none sm:gap-3 sm:px-4">
						<span class="flex items-center gap-1.5"><kbd class="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--text)]">M</kbd> {t('room.scMute')}</span>
						<span class="flex items-center gap-1.5"><kbd class="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--text)]">F</kbd> {t('room.scFullscreen')}</span>
						<span class="flex items-center gap-1.5"><kbd class="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--text)]">/</kbd> {t('room.scChat')}</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
