<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Monitor, ArrowLeft, Maximize, Minimize, Volume2, VolumeX, AlertCircle, Loader2, Wifi, WifiOff, Lock, Eye, EyeOff } from 'lucide-svelte';
	import { io } from 'socket.io-client';

	let roomId = $state('');
	let pin = $state('');
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let isAuthenticating = $state(false);
	let error = $state('');
	let videoElement: HTMLVideoElement;
	let socket: ReturnType<typeof io> | null = null;
	let peer: RTCPeerConnection | null = null;
	let isMuted = $state(false);
	let isFullscreen = $state(false);
	let hostDisconnected = $state(false);
	let pinError = $state('');
	let showPin = $state(false);
	let isAuthenticated = $state(false);

	const iceServers = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' }
	];

	onMount(() => {
		// Get roomId from URL (opaque ID, not PIN)
		roomId = $page.params.roomId || '';
		if (!roomId) {
			error = 'Enlace de sala no válido';
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

	function validatePin(value: string): boolean {
		pinError = '';
		if (!value) {
			pinError = 'Introduce el PIN de la sala';
			return false;
		}
		if (value.length !== 6) {
			pinError = 'El PIN debe tener 6 dígitos';
			return false;
		}
		if (!/^\d{6}$/.test(value)) {
			pinError = 'El PIN solo puede contener números';
			return false;
		}
		return true;
	}

	async function authenticateAndJoin() {
		if (!validatePin(pin)) {
			const input = document.querySelector('input[name="viewer-pin"]') as HTMLInputElement;
			if (input) {
				input.classList.add('animate-shake');
				setTimeout(() => input.classList.remove('animate-shake'), 400);
			}
			return;
		}

		isAuthenticating = true;
		error = '';

		try {
			const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
			socket = io(wsUrl, { transports: ['websocket'] });

			socket.on('connect', () => {
				console.log('Connected to signaling server');
				// Send roomId and PIN for authentication
				socket?.emit('viewer:join', { roomId, pin });
			});

			socket.on('room:auth-success', async () => {
				isAuthenticated = true;
				isAuthenticating = false;
				// Now proceed to connect
				await connectToStream();
			});

			socket.on('room:auth-failed', ({ message }: { message: string }) => {
				isAuthenticating = false;
				pinError = message || 'PIN incorrecto';
				const input = document.querySelector('input[name="viewer-pin"]') as HTMLInputElement;
				if (input) {
					input.classList.add('animate-shake');
					setTimeout(() => input.classList.remove('animate-shake'), 400);
				}
			});

			socket.on('room:error', ({ message }: { message: string }) => {
				error = message;
				isAuthenticating = false;
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
			isAuthenticating = false;
		}
	}

	async function connectToStream() {
		isConnecting = true;

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
				isConnected = true;
				isConnecting = false;
			}
		};

		socket?.on('host:signal', async ({ signal }: { signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
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
	}

	function handlePinInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const cleaned = target.value.replace(/\D/g, '').slice(0, 6);
		pin = cleaned;
		if (pinError) pinError = '';
		if (error) error = '';
	}

	function handlePinKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			authenticateAndJoin();
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
	<!-- PIN Authentication Screen -->
	{#if !isAuthenticated && !isConnecting && !isConnected}
		<div class="flex flex-1 flex-col items-center justify-center px-4">
			<div class="w-full max-w-sm animate-slide-up">
				<div class="mb-8 text-center">
					<div class="mb-5 flex justify-center">
						<div class="flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-slate-800 shadow-lg">
							<Lock class="h-8 w-8 text-slate-300" />
						</div>
					</div>
					<h1 class="text-2xl font-bold text-white">Sala protegida</h1>
					<p class="mt-2 text-sm text-slate-400">Introduce el PIN de 6 dígitos para acceder</p>
				</div>

				{#if error}
					<div class="mb-4 flex items-center gap-2 rounded-xl bg-red-50/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
						<AlertCircle class="h-4 w-4 flex-shrink-0" />
						{error}
					</div>
				{/if}

				<div class="space-y-4">
					<div class="relative">
						<input
							name="viewer-pin"
							type={showPin ? 'text' : 'password'}
							inputmode="numeric"
							maxlength="6"
							placeholder="000000"
							class="input-field w-full bg-slate-800 border-slate-700 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-slate-500 focus:border-slate-500 focus:ring-slate-500/20 {pinError ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}"
							value={pin}
							oninput={handlePinInput}
							onkeydown={handlePinKeydown}
						/>
						<button
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
							onclick={() => showPin = !showPin}
							title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
						>
							{#if showPin}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
					{#if pinError}
						<p class="text-xs text-red-400">{pinError}</p>
					{/if}
					<button onclick={authenticateAndJoin} disabled={isAuthenticating} class="btn-primary w-full py-3.5 gap-2">
						{#if isAuthenticating}
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
							Verificando...
						{:else}
							<Lock class="h-4 w-4" />
							Acceder a la sala
						{/if}
					</button>
					<button onclick={goBack} class="btn-secondary w-full gap-2 py-3.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white">
						<ArrowLeft class="h-4 w-4" />
						Volver al inicio
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Connecting State -->
	{#if isAuthenticating || isConnecting}
		<div class="flex flex-1 flex-col items-center justify-center animate-fade-in">
			<div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
				<Loader2 class="h-8 w-8 animate-spin text-slate-300" />
			</div>
			<p class="text-lg font-semibold text-white">
				{#if isAuthenticating}
					Verificando PIN...
				{:else}
					Conectando...
				{/if}
			</p>
			<p class="mt-2 text-sm text-slate-400">
				{#if isAuthenticating}
					Comprobando credenciales de la sala
				{:else}
					Estableciendo conexión segura
				{/if}
			</p>
		</div>
	{/if}

	<!-- Video Stream -->
	{#if isConnected}
		<div class="relative flex flex-1 items-center justify-center animate-fade-in">
			{#if hostDisconnected}
				<div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm">
					<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
						<WifiOff class="h-8 w-8 text-slate-400" />
					</div>
					<p class="text-xl font-semibold text-white">El anfitrión se ha desconectado</p>
					<p class="mt-2 text-sm text-slate-400">Esperando reconexión...</p>
					<div class="mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
						<div class="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-blue-500"></div>
					</div>
				</div>
			{/if}

			<video
				bind:this={videoElement}
				class="h-full w-full object-contain"
				autoplay
				playsinline
			/>

			<!-- Controls -->
			<div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 opacity-0 transition-opacity duration-300 hover:opacity-100">
				<button onclick={toggleMute} class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30" title={isMuted ? 'Activar audio' : 'Silenciar'}>
					{#if isMuted}
						<VolumeX class="h-5 w-5" />
					{:else}
						<Volume2 class="h-5 w-5" />
					{/if}
				</button>
				<button onclick={toggleFullscreen} class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30" title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
					{#if isFullscreen}
						<Minimize class="h-5 w-5" />
					{:else}
						<Maximize class="h-5 w-5" />
					{/if}
				</button>
				<button onclick={goBack} class="flex h-11 items-center justify-center gap-2 rounded-xl bg-white/20 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30">
					Salir de la sala
				</button>
			</div>
		</div>
	{/if}
</main>

<style>
	@keyframes slide {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(300%); }
	}
</style>
