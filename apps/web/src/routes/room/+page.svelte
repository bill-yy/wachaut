<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Monitor, Copy, Check, Share2, StopCircle, Users, Volume2, VolumeX, Maximize, Minimize } from 'lucide-svelte';
	import { io } from 'socket.io-client';

	// Room state
	let roomId = $state('');
	let pin = $state('');
	let isSharing = $state(false);
	let viewerCount = $state(0);
	let stream: MediaStream | null = null;
	let videoPreview: HTMLVideoElement;
	let socket: ReturnType<typeof io> | null = null;
	let peers = new Map<string, RTCPeerConnection>();
	let copied = $state(false);
	let isMuted = $state(false);
	let isFullscreen = $state(false);
	let error = $state('');
	let roomUrl = $state('');

	// TURN/STUN servers
	const iceServers = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' }
	];

	onMount(() => {
		// Generate room ID and PIN
		roomId = crypto.randomUUID();
		pin = Math.floor(100000 + Math.random() * 900000).toString();
		roomUrl = `${window.location.origin}/room/${pin}`;

		// Connect to signaling server
		const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
		socket = io(wsUrl, { transports: ['websocket'] });

		socket.on('connect', () => {
			console.log('Connected to signaling server');
			socket?.emit('host:create-room', { roomId, pin });
		});

		socket.on('viewer:joined', async ({ viewerId }: { viewerId: string }) => {
			viewerCount++;
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
			if (peer) {
				peer.close();
				peers.delete(viewerId);
			}
		});

		socket.on('disconnect', () => {
			error = 'Se ha perdido la conexión con el servidor. Intentando reconectar...';
		});
	});

	onDestroy(() => {
		stopSharing();
		socket?.disconnect();
	});

	async function createPeerConnection(viewerId: string, isHost: boolean) {
		const peer = new RTCPeerConnection({ iceServers });
		peers.set(viewerId, peer);

		peer.onicecandidate = (event) => {
			if (event.candidate) {
				socket?.emit('host:signal', { viewerId, signal: event.candidate });
			}
		};

		peer.onconnectionstatechange = () => {
			if (peer.connectionState === 'failed') {
				peer.close();
				peers.delete(viewerId);
			}
		};

		// Add stream tracks to peer connection
		if (stream) {
			stream.getTracks().forEach(track => {
				peer.addTrack(track, stream!);
			});
		}

		// Create offer if we're the host
		if (isHost) {
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

			// Show preview
			if (videoPreview) {
				videoPreview.srcObject = stream;
				videoPreview.play();
			}

			isSharing = true;
			error = '';

			// Add stream to existing peers
			peers.forEach((peer) => {
				stream!.getTracks().forEach(track => {
					peer.addTrack(track, stream!);
				});
			});

			// Handle stream end (user clicks "Stop sharing" in browser)
			stream.getVideoTracks()[0].onended = () => {
				stopSharing();
			};
		} catch (err) {
			console.error('Error starting screen share:', err);
			error = 'No se ha podido compartir la pantalla. Asegúrate de dar permiso al navegador.';
		}
	}

	function stopSharing() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		if (videoPreview) {
			videoPreview.srcObject = null;
		}
		isSharing = false;
		
		// Notify server
		socket?.emit('host:stop-sharing', { roomId });
	}

	function toggleMute() {
		if (stream) {
			const audioTrack = stream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				isMuted = !audioTrack.enabled;
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

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => copied = false, 2000);
		} catch {
			// Fallback
			const textarea = document.createElement('textarea');
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			copied = true;
			setTimeout(() => copied = false, 2000);
		}
	}

	function closeRoom() {
		if (confirm('¿Seguro que quieres cerrar la sala? Los espectadores perderán la conexión.')) {
			stopSharing();
			socket?.emit('host:close-room', { roomId });
			socket?.disconnect();
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>Sala de Wachaut</title>
</svelte:head>

<main class="flex min-h-screen flex-col">
	<!-- Header -->
	<header class="border-b border-slate-200 bg-white px-4 py-3">
		<div class="mx-auto flex max-w-6xl items-center justify-between">
			<div class="flex items-center gap-2">
				<Monitor class="h-5 w-5 text-slate-800" />
				<span class="font-semibold text-slate-800">Wachaut</span>
			</div>
			<div class="flex items-center gap-4">
				{#if isSharing}
					<div class="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
						<div class="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
						En vivo
					</div>
				{/if}
				<div class="flex items-center gap-1 text-sm text-slate-500">
					<Users class="h-4 w-4" />
					<span>{viewerCount} espectador{viewerCount === 1 ? '' : 'es'}</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Error Banner -->
	{#if error}
		<div class="mx-4 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
			{error}
		</div>
	{/if}

	<!-- Main Content -->
	<div class="flex flex-1 flex-col lg:flex-row">
		<!-- Video Area -->
		<div class="flex-1 bg-slate-900 p-4">
			<div class="relative mx-auto aspect-video max-w-4xl overflow-hidden rounded-lg bg-slate-800">
				{#if isSharing}
					<video
						bind:this={videoPreview}
						class="h-full w-full"
						autoplay
						muted
						playsinline
					></video>
					<!-- Controls Overlay -->
					<div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity hover:opacity-100">
						<button onclick={toggleMute} class="rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30" title={isMuted ? 'Activar audio' : 'Silenciar audio'}>
							{#if isMuted}
								<VolumeX class="h-5 w-5" />
							{:else}
								<Volume2 class="h-5 w-5" />
							{/if}
						</button>
						<button onclick={toggleFullscreen} class="rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30" title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
							{#if isFullscreen}
								<Minimize class="h-5 w-5" />
							{:else}
								<Maximize class="h-5 w-5" />
							{/if}
						</button>
						<button onclick={stopSharing} class="rounded-lg bg-red-500/90 p-2 text-white backdrop-blur-sm hover:bg-red-600" title="Detener compartir">
							<StopCircle class="h-5 w-5" />
						</button>
					</div>
				{:else}
					<div class="flex h-full flex-col items-center justify-center text-white">
						<Monitor class="mb-4 h-16 w-16 text-slate-500" />
						<p class="mb-4 text-lg text-slate-400">Tu pantalla aparecerá aquí</p>
						<button onclick={startSharing} class="btn-primary gap-2">
							<Share2 class="h-4 w-4" />
							Compartir pantalla
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Sidebar -->
		<div class="w-full border-l border-slate-200 bg-white p-4 lg:w-80">
			<div class="space-y-4">
				<!-- Room Info -->
				<div class="card">
					<h3 class="mb-3 text-sm font-semibold text-slate-800">Información de la sala</h3>
					
					<div class="mb-3">
						<label class="mb-1 block text-xs text-slate-500">PIN de acceso</label>
						<div class="flex items-center gap-2">
							<code class="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-slate-800">
								{pin}
							</code>
							<button onclick={() => copyToClipboard(pin)} class="rounded-lg border border-slate-200 p-2 hover:bg-slate-50" title="Copiar PIN">
								{#if copied}
									<Check class="h-4 w-4 text-green-600" />
								{:else}
									<Copy class="h-4 w-4 text-slate-500" />
								{/if}
							</button>
						</div>
					</div>

					<div>
						<label class="mb-1 block text-xs text-slate-500">Enlace para compartir</label>
						<div class="flex items-center gap-2">
							<input type="text" value={roomUrl} readonly class="input-field flex-1 text-xs" />
							<button onclick={() => copyToClipboard(roomUrl)} class="rounded-lg border border-slate-200 p-2 hover:bg-slate-50" title="Copiar enlace">
								{#if copied}
									<Check class="h-4 w-4 text-green-600" />
								{:else}
									<Copy class="h-4 w-4 text-slate-500" />
								{/if}
							</button>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="card">
					<h3 class="mb-3 text-sm font-semibold text-slate-800">Acciones</h3>
					<div class="space-y-2">
						{#if !isSharing}
							<button onclick={startSharing} class="btn-primary w-full gap-2">
								<Share2 class="h-4 w-4" />
								Compartir pantalla
							</button>
						{:else}
							<button onclick={stopSharing} class="w-full gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
								<StopCircle class="h-4 w-4" />
								Detener compartir
							</button>
						{/if}
						<button onclick={closeRoom} class="btn-secondary w-full gap-2">
							Cerrar sala
						</button>
					</div>
				</div>

				<!-- Tips -->
				<div class="rounded-lg bg-blue-50 p-4">
					<h4 class="mb-2 text-xs font-semibold text-blue-800">Consejo</h4>
					<p class="text-xs text-blue-600">
						Comparte el PIN o el enlace con tus amigos para que se unan a la sala.
					</p>
				</div>
			</div>
		</div>
	</div>
</main>
