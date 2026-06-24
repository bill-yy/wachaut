<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';
	import { Monitor, Copy, Check, Share2, StopCircle, Users, Volume2, VolumeX, Maximize, Minimize, ArrowLeft, AlertTriangle } from 'lucide-svelte';
	import { io } from 'socket.io-client';

	const roomId = writable('');
	const pin = writable('');
	const isSharing = writable(false);
	const viewerCount = writable(0);
	const copiedPin = writable(false);
	const copiedUrl = writable(false);
	const isMuted = writable(false);
	const isFullscreen = writable(false);
	const error = writable('');
	const roomUrl = writable('');
	const isLoading = writable(true);
	const showLeaveConfirm = writable(false);

	let stream: MediaStream | null = null;
	let videoPreview: HTMLVideoElement;
	let socket: ReturnType<typeof io> | null = null;
	let peers = new Map<string, RTCPeerConnection>();

	const iceServers = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' }
	];

	onMount(() => {
		roomId.set(crypto.randomUUID());
		pin.set(Math.floor(100000 + Math.random() * 900000).toString());
		roomUrl.set(`${window.location.origin}/room/${$roomId}`);
		isLoading.set(false);

		const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
		socket = io(wsUrl, { transports: ['websocket'] });

		socket.on('connect', () => {
			socket?.emit('host:create-room', { roomId: $roomId, pin: $pin });
		});

		socket.on('viewer:joined', async ({ viewerId }: { viewerId: string }) => {
			viewerCount.update(n => n + 1);
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
			viewerCount.update(n => Math.max(0, n - 1));
			const peer = peers.get(viewerId);
			if (peer) { peer.close(); peers.delete(viewerId); }
		});

		socket.on('disconnect', () => {
			error.set('Se ha perdido la conexión con el servidor.');
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
			if (event.candidate) socket?.emit('host:signal', { viewerId, signal: event.candidate });
		};
		peer.onconnectionstatechange = () => {
			if (peer.connectionState === 'failed') { peer.close(); peers.delete(viewerId); }
		};
		if (stream) stream.getTracks().forEach(track => peer.addTrack(track, stream!));
		if (isHost) {
			const offer = await peer.createOffer();
			await peer.setLocalDescription(offer);
			socket?.emit('host:signal', { viewerId, signal: offer });
		}
		return peer;
	}

	async function startSharing() {
		try {
			stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' as const }, audio: true });
			if (videoPreview) { videoPreview.srcObject = stream; videoPreview.play(); }
			isSharing.set(true);
			error.set('');
			peers.forEach((peer) => stream!.getTracks().forEach(track => peer.addTrack(track, stream!)));
			stream.getVideoTracks()[0].onended = () => stopSharing();
		} catch {
			error.set('No se ha podido compartir la pantalla.');
		}
	}

	function stopSharing() {
		if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
		if (videoPreview) videoPreview.srcObject = null;
		isSharing.set(false);
		socket?.emit('host:stop-sharing', { roomId: $roomId });
	}

	function toggleMute() {
		if (stream) { const t = stream.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; isMuted.set(!t.enabled); } }
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); isFullscreen.set(true); }
		else { document.exitFullscreen(); isFullscreen.set(false); }
	}

	async function copyToClipboard(text: string, type: 'pin' | 'url') {
		try { await navigator.clipboard.writeText(text); } catch {
			const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
		}
		if (type === 'pin') { copiedPin.set(true); setTimeout(() => copiedPin.set(false), 2000); }
		else { copiedUrl.set(true); setTimeout(() => copiedUrl.set(false), 2000); }
	}

	function goHome() {
		if ($isSharing || $viewerCount > 0) showLeaveConfirm.set(true);
		else confirmLeave();
	}

	function confirmLeave() {
		showLeaveConfirm.set(false);
		stopSharing();
		socket?.emit('host:close-room', { roomId: $roomId });
		socket?.disconnect();
		goto('/');
	}
</script>

<svelte:head>
	<title>Sala de Wachaut</title>
</svelte:head>

{#if $isLoading}
	<div class="flex min-h-screen items-center justify-center bg-slate-50">
		<p class="text-slate-500">Preparando sala...</p>
	</div>
{:else}
	<main class="flex min-h-screen flex-col bg-slate-50">
		<header class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
			<div class="mx-auto flex max-w-6xl items-center justify-between">
				<div class="flex items-center gap-3">
					<button onclick={goHome} class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Volver al inicio">
						<ArrowLeft class="h-4 w-4" />
					</button>
					<div class="flex items-center gap-2">
						<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800"><Monitor class="h-3.5 w-3.5 text-white" /></div>
						<span class="font-semibold text-slate-800">Wachaut</span>
					</div>
				</div>
				<div class="flex items-center gap-3">
					{#if $isSharing}
						<div class="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
							<div class="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>En vivo
						</div>
					{/if}
					<div class="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
						<Users class="h-3.5 w-3.5" />
						<span>{$viewerCount} espectador{$viewerCount === 1 ? '' : 'es'}</span>
					</div>
				</div>
			</div>
		</header>

		{#if $error}
			<div class="mx-4 mt-4"><div class="mx-auto flex max-w-6xl items-center gap-3 rounded-xl bg-red-50 px-4 py-3 border border-red-100">
				<AlertTriangle class="h-4 w-4 flex-shrink-0 text-red-500" /><p class="text-sm text-red-600">{$error}</p>
			</div></div>
		{/if}

		<div class="flex flex-1 flex-col lg:flex-row">
			<div class="flex-1 bg-slate-900 p-4">
				<div class="relative mx-auto aspect-video max-w-5xl overflow-hidden rounded-2xl bg-slate-800 shadow-2xl">
					{#if $isSharing}
						<video bind:this={videoPreview} class="h-full w-full" autoplay muted playsinline></video>
						<div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 opacity-0 transition-opacity duration-300 hover:opacity-100">
							<button onclick={toggleMute} class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30" title={$isMuted ? 'Activar audio' : 'Silenciar'}>
								{#if $isMuted}<VolumeX class="h-5 w-5" />{:else}<Volume2 class="h-5 w-5" />{/if}
							</button>
							<button onclick={toggleFullscreen} class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30" title="Pantalla completa">
								{#if $isFullscreen}<Minimize class="h-5 w-5" />{:else}<Maximize class="h-5 w-5" />{/if}
							</button>
							<button onclick={stopSharing} class="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 text-sm font-medium text-white hover:bg-red-600" title="Detener">
								<StopCircle class="h-5 w-5" /><span class="hidden sm:inline">Detener</span>
							</button>
						</div>
					{:else}
						<div class="flex h-full flex-col items-center justify-center text-white">
							<Monitor class="mb-6 h-10 w-10 text-slate-400" />
							<p class="mb-2 text-xl font-semibold text-slate-300">Tu pantalla aparecerá aquí</p>
							<p class="mb-6 text-sm text-slate-500">Haz clic para empezar a compartir</p>
							<button onclick={startSharing} class="btn-primary gap-2 px-6 py-3.5">
								<Share2 class="h-5 w-5" />Compartir pantalla
							</button>
						</div>
					{/if}
				</div>
			</div>

			<div class="w-full border-l border-slate-200/80 bg-white p-5 lg:w-80">
				<div class="space-y-5">
					<div class="card-static">
						<div class="mb-4 flex items-center gap-2"><div class="h-2 w-2 rounded-full bg-green-500"></div><h3 class="text-sm font-bold text-slate-800">Información de la sala</h3></div>
						<div class="mb-4">
							<label class="mb-1.5 block text-xs font-medium text-slate-500">PIN de acceso</label>
							<div class="flex items-center gap-2">
								<code class="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.3em] text-slate-800">{$pin}</code>
								<button onclick={() => copyToClipboard($pin, 'pin')} class="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50" title="Copiar PIN">
									{#if $copiedPin}<Check class="h-5 w-5 text-green-600" />{:else}<Copy class="h-5 w-5 text-slate-500" />{/if}
								</button>
							</div>
							{#if $copiedPin}<p class="mt-1.5 text-xs text-green-600">¡PIN copiado!</p>{/if}
						</div>
						<div>
							<label class="mb-1.5 block text-xs font-medium text-slate-500">Enlace para compartir</label>
							<div class="flex items-center gap-2">
								<input type="text" value={$roomUrl} readonly class="input-field flex-1 text-xs" />
								<button onclick={() => copyToClipboard($roomUrl, 'url')} class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50" title="Copiar enlace">
									{#if $copiedUrl}<Check class="h-5 w-5 text-green-600" />{:else}<Copy class="h-5 w-5 text-slate-500" />{/if}
								</button>
							</div>
							{#if $copiedUrl}<p class="mt-1.5 text-xs text-green-600">¡Enlace copiado!</p>{/if}
						</div>
					</div>
					<div class="card-static">
						<h3 class="mb-3 text-sm font-bold text-slate-800">Acciones</h3>
						<div class="space-y-2.5">
							{#if !$isSharing}
								<button onclick={startSharing} class="btn-primary w-full gap-2 py-3.5"><Share2 class="h-4 w-4" />Compartir pantalla</button>
							{:else}
								<button onclick={stopSharing} class="btn-danger w-full gap-2 py-3.5"><StopCircle class="h-4 w-4" />Detener compartir</button>
							{/if}
							<button onclick={goHome} class="btn-secondary w-full py-3.5">Cerrar sala</button>
						</div>
					</div>
					<div class="rounded-xl bg-blue-50 p-4 border border-blue-100">
						<p class="text-xs leading-relaxed text-blue-600">Comparte el enlace con tus amigos para que se unan. Máximo 5 espectadores.</p>
					</div>
				</div>
			</div>
		</div>
	</main>

	{#if $showLeaveConfirm}
		<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div class="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
				<h3 class="mb-2 text-lg font-bold text-slate-800">¿Cerrar la sala?</h3>
				<p class="mb-6 text-sm text-slate-500">Los espectadores perderán la conexión.</p>
				<div class="flex gap-3">
					<button onclick={() => showLeaveConfirm.set(false)} class="btn-secondary flex-1 py-3">Cancelar</button>
					<button onclick={confirmLeave} class="btn-danger flex-1 py-3">Cerrar sala</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
