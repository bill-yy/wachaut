<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Monitor, ArrowLeft, Maximize, Minimize, Volume2, VolumeX, AlertCircle } from 'lucide-svelte';
	import { io } from 'socket.io-client';

	let pin = $state('');
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let error = $state('');
	let videoElement: HTMLVideoElement;
	let socket: ReturnType<typeof io> | null = null;
	let peer: RTCPeerConnection | null = null;
	let isMuted = $state(false);
	let isFullscreen = $state(false);
	let hostDisconnected = $state(false);

	const iceServers = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' }
	];

	onMount(() => {
		// Get PIN from URL
		pin = $page.params.pin || '';
		if (pin.length === 6) {
			joinRoom();
		}
	});

	onDestroy(() => {
		cleanup();
	});

	function cleanup() {
		peer?.close();
		peer = null;
		socket?.disconnect();
		socket = null;
	}

	async function joinRoom() {
		if (pin.length !== 6) {
			error = 'El PIN debe tener 6 dígitos';
			return;
		}

		isConnecting = true;
		error = '';

		try {
			const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
			socket = io(wsUrl, { transports: ['websocket'] });

			socket.on('connect', () => {
				console.log('Connected to signaling server');
				socket?.emit('viewer:join', { pin });
			});

			socket.on('room:joined', async ({ roomId }: { roomId: string }) => {
				console.log('Joined room:', roomId);
				isConnected = true;
				isConnecting = false;

				// Create peer connection
				peer = new RTCPeerConnection({ iceServers });

				peer.ontrack = (event) => {
					if (videoElement && event.streams[0]) {
						videoElement.srcObject = event.streams[0];
						videoElement.play();
					}
				};

				peer.onicecandidate = (event) => {
					if (event.candidate) {
						socket?.emit('viewer:signal', { signal: event.candidate });
					}
				};

				peer.onconnectionstatechange = () => {
					if (peer?.connectionState === 'disconnected') {
						hostDisconnected = true;
					} else if (peer?.connectionState === 'connected') {
						hostDisconnected = false;
					}
				};
			});

			socket.on('host:signal', async ({ signal }: { signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
				if (!peer) return;

				if (signal.type === 'offer') {
					await peer.setRemoteDescription(new RTCSessionDescription(signal));
					const answer = await peer.createAnswer();
					await peer.setLocalDescription(answer);
					socket?.emit('viewer:signal', { signal: answer });
				} else if (signal.candidate) {
					await peer.addIceCandidate(new RTCIceCandidate(signal));
				}
			});

			socket.on('room:error', ({ message }: { message: string }) => {
				error = message;
				isConnecting = false;
				cleanup();
			});

			socket.on('host:disconnected', () => {
				hostDisconnected = true;
			});

			socket.on('host:reconnected', () => {
				hostDisconnected = false;
			});

			socket.on('room:closed', () => {
				error = 'La sala ha sido cerrada por el anfitrión.';
				isConnected = false;
				cleanup();
			});

			socket.on('disconnect', () => {
				if (!error) {
					error = 'Se ha perdido la conexión con el servidor.';
				}
				isConnected = false;
			});
		} catch (err) {
			console.error('Error joining room:', err);
			error = 'No se ha podido conectar a la sala. Inténtalo de nuevo.';
			isConnecting = false;
		}
	}

	function toggleMute() {
		if (videoElement) {
			videoElement.muted = !videoElement.muted;
			isMuted = videoElement.muted;
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

	function goBack() {
		cleanup();
		goto('/');
	}
</script>

<svelte:head>
	<title>{isConnected ? 'Viendo pantalla - Wachaut' : 'Unirse a sala - Wachaut'}</title>
</svelte:head>

<main class="flex min-h-screen flex-col bg-slate-900">
	<!-- PIN Input Screen -->
	{#if !isConnected && !isConnecting}
		<div class="flex flex-1 flex-col items-center justify-center px-4">
			<div class="w-full max-w-sm">
				<div class="mb-8 text-center">
					<Monitor class="mx-auto mb-4 h-12 w-12 text-slate-400" />
					<h1 class="text-2xl font-bold text-white">Unirse a una sala</h1>
					<p class="mt-2 text-sm text-slate-400">Introduce el PIN de 6 dígitos que te ha compartido el anfitrión</p>
				</div>

				{#if error}
					<div class="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
						<AlertCircle class="h-4 w-4 flex-shrink-0" />
						{error}
					</div>
				{/if}

				<div class="space-y-4">
					<input
						type="text"
						inputmode="numeric"
						maxlength="6"
						placeholder="000000"
						class="input-field w-full text-center text-2xl font-mono tracking-[0.5em]"
						bind:value={pin}
						onkeydown={(e) => e.key === 'Enter' && joinRoom()}
					/>
					<button onclick={joinRoom} class="btn-primary w-full">
						Unirse a la sala
					</button>
					<button onclick={goBack} class="btn-secondary w-full gap-2">
						<ArrowLeft class="h-4 w-4" />
						Volver al inicio
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Connecting State -->
	{#if isConnecting}
		<div class="flex flex-1 flex-col items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-white"></div>
			<p class="mt-4 text-sm text-slate-400">Conectando a la sala...</p>
		</div>
	{/if}

	<!-- Video Stream -->
	{#if isConnected}
		<div class="relative flex flex-1 items-center justify-center">
			{#if hostDisconnected}
				<div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90">
					<div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-white"></div>
					<p class="mt-4 text-lg text-white">El anfitrión se ha desconectado</p>
					<p class="text-sm text-slate-400">Esperando reconexión...</p>
				</div>
			{/if}

			<video
				bind:this={videoElement}
				class="h-full w-full object-contain"
				autoplay
				playsinline
			/>

			<!-- Controls -->
			<div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity hover:opacity-100">
				<button onclick={toggleMute} class="rounded-lg bg-white/20 p-3 text-white backdrop-blur-sm hover:bg-white/30" title={isMuted ? 'Activar audio' : 'Silenciar'}>
					{#if isMuted}
						<VolumeX class="h-5 w-5" />
					{:else}
						<Volume2 class="h-5 w-5" />
					{/if}
				</button>
				<button onclick={toggleFullscreen} class="rounded-lg bg-white/20 p-3 text-white backdrop-blur-sm hover:bg-white/30" title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
					{#if isFullscreen}
						<Minimize class="h-5 w-5" />
					{:else}
						<Maximize class="h-5 w-5" />
					{/if}
				</button>
				<button onclick={goBack} class="rounded-lg bg-white/20 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30">
					Salir de la sala
				</button>
			</div>
		</div>
	{/if}
</main>
