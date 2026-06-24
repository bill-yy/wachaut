<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/stores';
	import { Monitor, Lock, Wifi, WifiOff, AlertTriangle, Maximize, Minimize, Volume2, VolumeX } from 'lucide-svelte';
	import { io } from 'socket.io-client';

	// --- State ---
	let pinInput = $state('');
	let status = $state<'idle' | 'connecting' | 'auth' | 'waiting' | 'live' | 'error' | 'disconnected'>('idle');
	let errorMsg = $state('');
	let isFullscreen = $state(false);
	let isMuted = $state(false);

	// --- Refs ---
	let videoEl: HTMLVideoElement | undefined;

	// --- WebRTC ---
	let socket: ReturnType<typeof io> | null = null;
	let peer: RTCPeerConnection | null = null;
	let pendingStream: MediaStream | null = null;

	const iceServers = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' }
	];

	const roomId = $derived($page.params.roomId);

	// When videoEl becomes available and we have a pending stream, attach it
	$effect(() => {
		if (videoEl && pendingStream) {
			videoEl.srcObject = pendingStream;
			videoEl.play().catch(() => {});
			pendingStream = null;
		}
	});

	function setError(msg: string) {
		errorMsg = msg;
		status = 'error';
	}

	function attachStream(stream: MediaStream) {
		if (videoEl) {
			videoEl.srcObject = stream;
			videoEl.play().catch(() => {});
		} else {
			pendingStream = stream;
		}
	}

	function connect() {
		if (!pinInput.trim()) return;

		status = 'connecting';
		errorMsg = '';

		const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
		socket = io(wsUrl, { transports: ['websocket'] });

		socket.on('connect', () => {
			status = 'auth';
			socket?.emit('viewer:join', { roomId, pin: pinInput.trim() });
		});

		socket.on('room:auth-success', () => {
			status = 'waiting';
		});

		socket.on('room:auth-failed', ({ message }: { message: string }) => {
			setError(message);
			socket?.disconnect();
		});

		socket.on('room:error', ({ message }: { message: string }) => {
			setError(message);
			socket?.disconnect();
		});

		socket.on('room:joined', () => {
			status = 'waiting';
		});

		socket.on('host:signal', async ({ signal }: { signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
			// Create peer on first signal (the offer)
			if (!peer) {
				peer = new RTCPeerConnection({ iceServers });

				peer.onicecandidate = (event) => {
					if (event.candidate) {
						socket?.emit('viewer:signal', { signal: event.candidate });
					}
				};

				peer.ontrack = (event) => {
					// Use the first track's stream (they share the same MediaStream)
					const remoteStream = event.streams[0];
					if (remoteStream) {
						attachStream(remoteStream);
						status = 'live';
					}
				};

				peer.onconnectionstatechange = () => {
					const state = peer?.connectionState;
					if (state === 'failed') {
						setError('La conexión se ha perdido.');
					} else if (state === 'disconnected') {
						status = 'disconnected';
					}
				};
			}

			// Handle offer (initial or renegotiation)
			if (signal.type === 'offer') {
				await peer.setRemoteDescription(new RTCSessionDescription(signal));
				const answer = await peer.createAnswer();
				await peer.setLocalDescription(answer);
				socket?.emit('viewer:signal', { signal: peer.localDescription! });
			} else if (signal.candidate) {
				await peer.addIceCandidate(new RTCIceCandidate(signal));
			}
		});

		socket.on('host:stopped-sharing', () => {
			status = 'waiting';
			if (videoEl) videoEl.srcObject = null;
			pendingStream = null;
		});

		socket.on('host:disconnected', () => {
			setError('El anfitrión se ha desconectado.');
			socket?.disconnect();
		});

		socket.on('room:closed', () => {
			setError('La sala se ha cerrado.');
			socket?.disconnect();
		});

		socket.on('disconnect', () => {
			if (status !== 'error') {
				status = 'disconnected';
			}
		});

		socket.on('connect_error', () => {
			setError('No se ha podido conectar al servidor.');
		});
	}

	function toggleMute() {
		if (videoEl) {
			videoEl.muted = !videoEl.muted;
			isMuted = videoEl.muted;
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

	function disconnect() {
		peer?.close();
		peer = null;
		pendingStream = null;
		socket?.disconnect();
		socket = null;
		status = 'idle';
	}

	onDestroy(() => {
		peer?.close();
		socket?.disconnect();
	});
</script>

<svelte:head>
	<title>Wachaut — Entrando a sala</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
	<!-- Header -->
	<div class="mb-8 flex items-center gap-2.5">
		<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 shadow-lg shadow-slate-800/20">
			<Monitor class="h-4 w-4 text-white" />
		</div>
		<span class="text-lg font-bold text-slate-800">Wachaut</span>
	</div>

	<!-- PIN Input Card (idle state) -->
	{#if status === 'idle'}
		<div class="w-full max-w-sm animate-slide-up">
			<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
				<div class="mb-6 flex justify-center">
					<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
						<Lock class="h-6 w-6 text-slate-600" />
					</div>
				</div>
				<h1 class="mb-2 text-center text-xl font-bold text-slate-800">Entrar a la sala</h1>
				<p class="mb-6 text-center text-sm text-slate-500">Introduce el PIN que te ha dado el anfitrión</p>

				<form
					onsubmit={(e) => { e.preventDefault(); connect(); }}
					class="space-y-4"
				>
					<input
						type="text"
						inputmode="numeric"
						maxlength="6"
						placeholder="PIN de 6 dígitos"
						bind:value={pinInput}
						class="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.4em] text-slate-800 placeholder:text-slate-300 placeholder:tracking-[0.2em] placeholder:font-normal focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
						autofocus
					/>
					<button
						type="submit"
						disabled={pinInput.length < 6}
						class="btn-primary w-full py-3.5"
					>
						Entrar a la sala
					</button>
				</form>
			</div>
			<p class="mt-4 text-center text-xs text-slate-400">Máximo 5 espectadores · Conexión directa P2P</p>
		</div>

	<!-- Connecting/Auth states -->
	{:else if status === 'connecting' || status === 'auth'}
		<div class="animate-fade-in text-center">
			<div class="mb-4 inline-flex h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800"></div>
			<p class="text-sm text-slate-500">
				{status === 'connecting' ? 'Conectando...' : 'Verificando PIN...'}
			</p>
		</div>

	<!-- Waiting for host to share -->
	{:else if status === 'waiting'}
		<div class="animate-fade-in text-center">
			<div class="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-slate-100">
				<Monitor class="h-9 w-9 text-slate-400" />
			</div>
			<h2 class="mb-2 text-lg font-semibold text-slate-700">Esperando al anfitrión</h2>
			<p class="text-sm text-slate-400">El anfitrión empezará a compartir en breve</p>
		</div>

	<!-- Live - watching stream -->
	{:else if status === 'live'}
		<div class="w-full max-w-5xl animate-fade-in">
			<!-- Video container -->
			<div class="relative overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
				<video
					bind:this={videoEl}
					class="h-auto w-full"
					autoplay
					playsinline
				></video>

				<!-- Live badge -->
				<div class="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
					<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></div>
					En vivo
				</div>

				<!-- Controls overlay -->
				<div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 opacity-0 transition-opacity duration-300 hover:opacity-100">
					<button onclick={toggleMute} class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm hover:bg-white/30" title={isMuted ? 'Activar audio' : 'Silenciar'}>
						{#if isMuted}<VolumeX class="h-5 w-5" />{:else}<Volume2 class="h-5 w-5" />{/if}
					</button>
					<button onclick={toggleFullscreen} class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm hover:bg-white/30" title="Pantalla completa">
						{#if isFullscreen}<Minimize class="h-5 w-5" />{:else}<Maximize class="h-5 w-5" />{/if}
					</button>
				</div>
			</div>

			<!-- Status bar -->
			<div class="mt-3 flex items-center justify-between px-1">
				<div class="flex items-center gap-2 text-xs text-slate-400">
					<Wifi class="h-3.5 w-3.5 text-green-500" />
					Conexión directa
				</div>
				<button onclick={disconnect} class="text-xs text-slate-400 hover:text-slate-600 transition-colors">
					Salir de la sala
				</button>
			</div>
		</div>

	<!-- Error state -->
	{:else if status === 'error'}
		<div class="w-full max-w-sm animate-scale-in">
			<div class="rounded-2xl border border-red-100 bg-white p-8 shadow-sm text-center">
				<div class="mb-4 flex justify-center">
					<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
						<AlertTriangle class="h-6 w-6 text-red-500" />
					</div>
				</div>
				<h2 class="mb-2 text-lg font-bold text-slate-800">Algo ha salido mal</h2>
				<p class="mb-6 text-sm text-slate-500">{errorMsg}</p>
				<button onclick={() => { status = 'idle'; errorMsg = ''; }} class="btn-primary w-full py-3">
					Volver a intentar
				</button>
			</div>
		</div>

	<!-- Disconnected -->
	{:else if status === 'disconnected'}
		<div class="w-full max-w-sm animate-scale-in">
			<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
				<div class="mb-4 flex justify-center">
					<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
						<WifiOff class="h-6 w-6 text-slate-400" />
					</div>
				</div>
				<h2 class="mb-2 text-lg font-bold text-slate-800">Desconectado</h2>
				<p class="mb-6 text-sm text-slate-500">Se ha perdido la conexión con la sala.</p>
				<button onclick={() => { status = 'idle'; errorMsg = ''; pinInput = ''; }} class="btn-primary w-full py-3">
					Reconectarse
				</button>
			</div>
		</div>
	{/if}
</main>
