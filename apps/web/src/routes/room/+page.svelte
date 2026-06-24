<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Monitor, Copy, Check, Share2, StopCircle, Users, Volume2, VolumeX, Maximize, Minimize, ArrowLeft, AlertTriangle, Eye, Link2 } from 'lucide-svelte';
	import { io } from 'socket.io-client';

	// --- State ---
	let roomId = $state('');
	let pin = $state('');
	let isSharing = $state(false);
	let viewerCount = $state(0);
	let copiedPin = $state(false);
	let copiedUrl = $state(false);
	let isMuted = $state(false);
	let isFullscreen = $state(false);
	let errorMsg = $state('');
	let roomUrl = $state('');
	let isReady = $state(false);
	let showLeaveConfirm = $state(false);

	// --- Refs ---
	let videoPreview: HTMLVideoElement | undefined;
	let stream: MediaStream | null = null;
	let socket: ReturnType<typeof io> | null = null;
	let peers = new Map<string, RTCPeerConnection>();

	const iceServers = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' }
	];

	onMount(() => {
		roomId = crypto.randomUUID();
		pin = Math.floor(100000 + Math.random() * 900000).toString();
		roomUrl = `${window.location.origin}/room/${roomId}`;

		const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
		socket = io(wsUrl, { transports: ['websocket'] });

		socket.on('connect', () => {
			socket?.emit('host:create-room', { roomId, pin });
			isReady = true;
		});

		socket.on('viewer:joined', async ({ viewerId }: { viewerId: string }) => {
			viewerCount = viewerCount + 1;
			await createPeerConnection(viewerId, true);
		});

		socket.on('viewer:signal', async ({ viewerId, signal }: { viewerId: string; signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
			const peer = peers.get(viewerId);
			if (!peer) return;
			if (signal.type === 'offer') {
				await peer.setRemoteDescription(new RTCSessionDescription(signal));
				const answer = await peer.createAnswer();
				await peer.setLocalDescription(answer);
				socket?.emit('host:signal', { viewerId, signal: answer });
			} else if (signal.candidate) {
				await peer.addIceCandidate(new RTCIceCandidate(signal));
			}
		});

		socket.on('viewer:left', ({ viewerId }: { viewerId: string }) => {
			viewerCount = Math.max(0, viewerCount - 1);
			const peer = peers.get(viewerId);
			if (peer) { peer.close(); peers.delete(viewerId); }
		});

		socket.on('disconnect', () => {
			errorMsg = 'Se ha perdido la conexión con el servidor.';
		});
	});

	onDestroy(() => {
		stopSharing();
		socket?.disconnect();
	});

	async function createPeerConnection(viewerId: string, isOffer: boolean) {
		const peer = new RTCPeerConnection({ iceServers });
		peers.set(viewerId, peer);

		peer.onicecandidate = (event) => {
			if (event.candidate) socket?.emit('host:signal', { viewerId, signal: event.candidate });
		};

		peer.onconnectionstatechange = () => {
			if (peer.connectionState === 'failed') {
				peer.close();
				peers.delete(viewerId);
			}
		};

		// Add existing stream tracks if already sharing
		if (stream) {
			stream.getTracks().forEach(track => peer.addTrack(track, stream!));
		}

		if (isOffer) {
			const offer = await peer.createOffer();
			await peer.setLocalDescription(offer);
			socket?.emit('host:signal', { viewerId, signal: offer });
		}

		return peer;
	}

	async function startSharing() {
		try {
			stream = await navigator.mediaDevices.getDisplayMedia({
				video: { cursor: 'always' as const },
				audio: true
			});

			isSharing = true;
			errorMsg = '';

			// Wait for next tick so videoPreview element exists in DOM
			await tick();

			if (videoPreview) {
				videoPreview.srcObject = stream;
				videoPreview.play().catch(() => {});
			}

			// Add tracks to all existing peer connections
			peers.forEach((peer) => {
				stream!.getTracks().forEach(track => peer.addTrack(track, stream!));
			});

			// Handle user stopping sharing via browser UI
			stream.getVideoTracks()[0].onended = () => stopSharing();
		} catch {
			errorMsg = 'No se ha podido compartir la pantalla.';
		}
	}

	function stopSharing() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		if (videoPreview) videoPreview.srcObject = null;
		isSharing = false;
		socket?.emit('host:stop-sharing', { roomId });
	}

	function toggleMute() {
		if (stream) {
			const track = stream.getAudioTracks()[0];
			if (track) {
				track.enabled = !track.enabled;
				isMuted = !track.enabled;
			}
		}
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
			isFullscreen = true;
		} else {
			document.exitFullscreen();
			isFullscreen = false;
		}
	}

	async function copyToClipboard(text: string, type: 'pin' | 'url') {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
		}
		if (type === 'pin') {
			copiedPin = true;
			setTimeout(() => copiedPin = false, 2000);
		} else {
			copiedUrl = true;
			setTimeout(() => copiedUrl = false, 2000);
		}
	}

	function goHome() {
		if (isSharing || viewerCount > 0) {
			showLeaveConfirm = true;
		} else {
			confirmLeave();
		}
	}

	function confirmLeave() {
		showLeaveConfirm = false;
		stopSharing();
		socket?.emit('host:close-room', { roomId });
		socket?.disconnect();
		goto('/');
	}

	// Svelte 5 tick replacement
	function tick(): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, 0));
	}
</script>

<svelte:head>
	<title>Wachaut — Tu sala</title>
</svelte:head>

<!-- Loading overlay -->
<div
	class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50 transition-all duration-700"
	class:opacity-0={isReady}
	class:pointer-events-none={isReady}
>
	<div class="text-center">
		<div class="mb-4 inline-flex h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800"></div>
		<p class="text-sm font-medium text-slate-400">Creando sala...</p>
	</div>
</div>

<!-- Room UI -->
<div class="min-h-screen bg-slate-50 transition-opacity duration-500" class:opacity-0={!isReady}>
	<!-- Top bar -->
	<header class="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
			<div class="flex items-center gap-3">
				<button onclick={goHome} class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" title="Volver al inicio">
					<ArrowLeft class="h-4 w-4" />
				</button>
				<div class="h-4 w-px bg-slate-200"></div>
				<div class="flex items-center gap-2">
					<div class="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800"><Monitor class="h-3 w-3 text-white" /></div>
					<span class="text-sm font-semibold text-slate-700">Wachaut</span>
				</div>
			</div>

			<div class="flex items-center gap-3">
				{#if isSharing}
					<div class="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-100">
						<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></div>
						En vivo
					</div>
				{/if}
				<div class="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
					<Eye class="h-3.5 w-3.5" />
					{viewerCount}
				</div>
			</div>
		</div>
	</header>

	<!-- Error banner -->
	{#if errorMsg}
		<div class="mx-4 mt-4 animate-slide-up">
			<div class="mx-auto flex max-w-7xl items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
				<AlertTriangle class="h-4 w-4 flex-shrink-0 text-red-400" />
				<p class="text-sm text-red-600">{errorMsg}</p>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<div class="mx-auto max-w-7xl p-4">
		<div class="flex flex-col gap-4 lg:flex-row">
			<!-- Video area -->
			<div class="flex-1">
				<div class="relative overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
					{#if isSharing}
						<video bind:this={videoPreview} class="h-auto w-full" autoplay muted playsinline></video>

						<!-- Floating controls -->
						<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-black/50 px-3 py-2 backdrop-blur-xl transition-opacity duration-300 hover:bg-black/60">
							<button onclick={toggleMute} class="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/20 hover:text-white" title={isMuted ? 'Activar audio' : 'Silenciar'}>
								{#if isMuted}<VolumeX class="h-4 w-4" />{:else}<Volume2 class="h-4 w-4" />{/if}
							</button>
							<button onclick={toggleFullscreen} class="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/20 hover:text-white" title="Pantalla completa">
								{#if isFullscreen}<Minimize class="h-4 w-4" />{:else}<Maximize class="h-4 w-4" />{/if}
							</button>
							<div class="mx-1 h-5 w-px bg-white/20"></div>
							<button onclick={stopSharing} class="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 text-xs font-medium text-white transition-colors hover:bg-red-600" title="Dejar de compartir">
								<StopCircle class="h-4 w-4" />
								<span class="hidden sm:inline">Detener</span>
							</button>
						</div>
					{:else}
						<div class="flex aspect-video flex-col items-center justify-center p-8 text-center">
							<div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
								<Monitor class="h-7 w-7 text-slate-400" />
							</div>
							<p class="mb-1 text-lg font-semibold text-slate-300">Tu pantalla aparecerá aquí</p>
							<p class="mb-6 text-sm text-slate-500">Comparte tu pantalla para que los espectadores puedan verla</p>
							<button onclick={startSharing} class="btn-primary gap-2 px-6 py-3">
								<Share2 class="h-4 w-4" />
								Compartir pantalla
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Sidebar -->
			<div class="w-full shrink-0 lg:w-80">
				<div class="space-y-4">
					<!-- Room info card -->
					<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Información de la sala</h3>

						<!-- PIN -->
						<div class="mb-4">
							<label class="mb-1.5 block text-xs font-medium text-slate-500">PIN de acceso</label>
							<div class="flex items-center gap-2">
								<code class="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.3em] text-slate-800 ring-1 ring-slate-100">{pin}</code>
								<button onclick={() => copyToClipboard(pin, 'pin')} class="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95" title="Copiar PIN">
									{#if copiedPin}<Check class="h-4 w-4 text-green-500" />{:else}<Copy class="h-4 w-4 text-slate-400" />{/if}
								</button>
							</div>
							{#if copiedPin}
								<p class="mt-1.5 text-xs text-green-600">¡Copiado!</p>
							{/if}
						</div>

						<!-- URL -->
						<div>
							<label class="mb-1.5 block text-xs font-medium text-slate-500">Enlace para compartir</label>
							<div class="flex items-center gap-2">
								<input type="text" value={roomUrl} readonly class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-100" />
								<button onclick={() => copyToClipboard(roomUrl, 'url')} class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95" title="Copiar enlace">
									{#if copiedUrl}<Check class="h-4 w-4 text-green-500" />{:else}<Link2 class="h-4 w-4 text-slate-400" />{/if}
								</button>
							</div>
							{#if copiedUrl}
								<p class="mt-1.5 text-xs text-green-600">¡Copiado!</p>
							{/if}
						</div>
					</div>

					<!-- Actions card -->
					<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Acciones</h3>
						<div class="space-y-2.5">
							{#if !isSharing}
								<button onclick={startSharing} class="btn-primary w-full gap-2 py-3">
									<Share2 class="h-4 w-4" />
									Compartir pantalla
								</button>
							{:else}
								<button onclick={stopSharing} class="btn-danger w-full gap-2 py-3">
									<StopCircle class="h-4 w-4" />
									Detener compartir
								</button>
							{/if}
							<button onclick={goHome} class="btn-secondary w-full py-3">Cerrar sala</button>
						</div>
					</div>

					<!-- Info -->
					<div class="rounded-xl bg-blue-50/80 p-4 ring-1 ring-blue-100/50">
						<p class="text-xs leading-relaxed text-blue-600">
							Comparte el enlace con tus amigos. Ellos necesitarán el PIN para entrar. Máximo 5 espectadores simultáneos.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Leave confirmation modal -->
{#if showLeaveConfirm}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<div class="mx-4 w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-2xl">
			<h3 class="mb-2 text-lg font-bold text-slate-800">¿Cerrar la sala?</h3>
			<p class="mb-6 text-sm text-slate-500">Los espectadores perderán la conexión.</p>
			<div class="flex gap-3">
				<button onclick={() => showLeaveConfirm = false} class="btn-secondary flex-1 py-2.5">Cancelar</button>
				<button onclick={confirmLeave} class="btn-danger flex-1 py-2.5">Cerrar sala</button>
			</div>
		</div>
	</div>
{/if}
