<script>
  import { tick } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    Monitor,
    Copy,
    Check,
    Share2,
    StopCircle,
    Users,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    ArrowLeft,
    AlertTriangle,
    Eye,
    Link2,
    MessageCircle,
    Send,
    Settings,
    Circle,
    Square
  } from 'lucide-svelte';
  import { io } from 'socket.io-client';

  // ─── State ───────────────────────────────────────────────────────────
  let socket = $state(null);
  let connected = $state(false);
  let isSharing = $state(false);
  let isMuted = $state(false);
  let isFullscreen = $state(false);
  let viewerCount = $state(0);
  let error = $state('');
  let showLeaveModal = $state(false);
  let loading = $state(true);
  let copiedPin = $state(false);
  let copiedUrl = $state(false);

  let videoPreview = $state(null);

  // WebRTC
  let peers = new Map();
  let localStream = $state(null);

  // Chat
  let chatMessages = $state([]);
  let chatInput = $state('');
  let chatContainer = $state(null);
  let showChat = $state(false);

  // Reactions
  let activeReactions = $state(new Map());
  let reactionIdCounter = $state(0);

  // First viewer celebration
  let showFirstViewerCelebration = $state(false);
  let confettiParticles = $state([]);
  // ─── First Viewer Celebration ────────────────────────────────────
  function triggerFirstViewerCelebration() {
    showFirstViewerCelebration = true;

    // Generate confetti particles
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
    const emojis = ['🎉', '🎊', '✨', '🥳', '👋', '🙌'];
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1.5,
        rotation: Math.random() * 360,
        size: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.3 ? 'rect' : 'emoji',
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        borderRadius: Math.random() > 0.5 ? '50%' : '2px'
      });
    }
    confettiParticles = particles;

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      showFirstViewerCelebration = false;
      confettiParticles = [];
    }, 3500);
  }

  // Recording
  let isRecording = $state(false);
  let mediaRecorder = $state(null);
  let recordedChunks = $state([]);
  let recordingDuration = $state(0);
  let recordingInterval = $state(null);

  // Quality Settings
  let qualityPreset = $state('normal');
  let showSettings = $state(false);
  const presets = {
    low: { label: 'Liviano', resolution: { width: 1280, height: 720 }, fps: 15, bitrate: 1_000_000, desc: 'Ideal para conexiones lentas' },
    normal: { label: 'Normal', resolution: { width: 1920, height: 1080 }, fps: 30, bitrate: 2_500_000, desc: 'Uso general' },
    high: { label: 'Alta calidad', resolution: { width: 1920, height: 1080 }, fps: 60, bitrate: 5_000_000, desc: 'Gaming y diseño' }
  };

  // Room info
  const roomId = crypto.randomUUID();
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  const roomUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}`;

  // Attach stream to video element when both are available
  $effect(() => {
    if (videoPreview && localStream) {
      videoPreview.srcObject = localStream;
      videoPreview.play().catch(() => {});
    }
  });

  // ─── Reactions ───────────────────────────────────────────────────────
  function addReaction(emoji) {
    const id = ++reactionIdCounter;
    const newReaction = {
      id,
      emoji,
      x: Math.random() * 80 + 10, // 10-90% of container width
      createdAt: Date.now()
    };
    activeReactions = new Map(activeReactions).set(id, newReaction);

    // Remove after 3 seconds
    setTimeout(() => {
      activeReactions = new Map(activeReactions);
      activeReactions.delete(id);
    }, 3000);
  }

  function handleSendReaction(emoji) {
    if (!socket || !connected) return;
    socket.emit('reaction:send', { emoji, roomId });
  }

  // ─── Recording ──────────────────────────────────────────────────────
  function formatDuration(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function startRecording() {
    if (!localStream) return;
    recordedChunks = [];
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }
    mediaRecorder = new MediaRecorder(localStream, options);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wachaut-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      recordedChunks = [];
    };
    mediaRecorder.start(1000);
    isRecording = true;
    recordingDuration = 0;
    recordingInterval = setInterval(() => { recordingDuration++; }, 1000);
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    isRecording = false;
    clearInterval(recordingInterval);
    recordingInterval = null;
  }

  // ─── Chat ────────────────────────────────────────────────────────────
  function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || !socket || !connected || text.length > 500) return;

    socket.emit('chat:message', { roomId, text, sender: 'Anfitrión' });
    chatInput = '';
  }

  function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }

  // Auto-scroll chat
  $effect(() => {
    const _ = chatMessages.length;
    if (chatContainer) {
      tick().then(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }
  });

  // ─── Socket.IO ───────────────────────────────────────────────────────
  function initSocket() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
    socket = io(wsUrl, { transports: ['websocket'] });

    socket.on('connect', () => {
      connected = true;
      socket.emit('host:create-room', { roomId, pin });
      setTimeout(() => { loading = false; }, 800);
    });

    socket.on('disconnect', () => {
      connected = false;
    });

    socket.on('error', (err) => {
      error = typeof err === 'string' ? err : err.message || 'Error de conexión';
      setTimeout(() => { error = ''; }, 5000);
    });

    // Viewers
    socket.on('viewer:joined', (data) => {
      const wasEmpty = viewerCount === 0;
      viewerCount = viewerCount + 1;
      if (data.viewerId) {
        createPeerConnection(data.viewerId);
      }
      if (wasEmpty) {
        triggerFirstViewerCelebration();
      }
    });

    socket.on('viewer:left', (data) => {
      viewerCount = Math.max(0, viewerCount - 1);
      if (data.viewerId) {
        const pc = peers.get(data.viewerId);
        if (pc) { pc.close(); peers.delete(data.viewerId); }
      }
    });

    // WebRTC signaling from viewer (answer + ICE candidates)
    socket.on('viewer:signal', async (data) => {
      const pc = peers.get(data.viewerId);
      if (!pc) return;
      if (data.signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
      } else if (data.signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.signal));
      }
    });

    // Chat
    socket.on('chat:history', (data) => {
      if (data?.messages) {
        chatMessages = data.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp || Date.now())
        }));
      }
    });

    socket.on('chat:message', (msg) => {
      chatMessages = [...chatMessages, {
        ...msg,
        timestamp: new Date(msg.timestamp || Date.now())
      }];
    });

    // Reactions from viewers
    socket.on('reaction:receive', (data) => {
      addReaction(data.emoji);
    });
  }

  // ─── WebRTC ──────────────────────────────────────────────────────────
  let iceServers = $state(null);
  let peers = new Map();
  let localStream = $state(null);

  async function fetchIceServers() {
    if (iceServers) return iceServers;
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
      const httpUrl = wsUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
      const res = await fetch(`${httpUrl}/turn-credentials?id=${socket?.id || crypto.randomUUID()}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      iceServers = data.iceServers;
      console.log('[host] ICE servers loaded:', iceServers.map(s => s.urls));
      return iceServers;
    } catch (e) {
      console.error('[host] Failed to fetch TURN credentials, falling back to STUN:', e);
      iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];
      return iceServers;
    }
  }

  async function createPeerConnection(viewerId) {
    if (peers.has(viewerId)) return;

    const servers = await fetchIceServers();
    const pc = new RTCPeerConnection({ iceServers: servers });

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit('host:signal', { viewerId, signal: event.candidate });
    };

    pc.onconnectionstatechange = () => {
      console.log(`[host] viewer=${viewerId} connectionState=${pc.connectionState} iceState=${pc.iceConnectionState}`);
      if (pc.connectionState === 'failed') { pc.close(); peers.delete(viewerId); }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[host] viewer=${viewerId} iceConnectionState=${pc.iceConnectionState}`);
    };

    // Add existing stream tracks if already sharing
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    peers.set(viewerId, pc);

    // If already sharing, send offer immediately
    if (localStream) {
      await sendOffer(pc, viewerId);
    }
  }

  async function sendOffer(pc, viewerId) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('host:signal', { viewerId, signal: pc.localDescription });
  }

  // ─── Screen Sharing ─────────────────────────────────────────────────
  async function startSharing() {
    try {
      const preset = presets[qualityPreset];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          width: { ideal: preset.resolution.width },
          height: { ideal: preset.resolution.height },
          frameRate: { ideal: preset.fps }
        },
        audio: true
      });
      localStream = stream;
      isSharing = true;

      // Wait for DOM update so videoPreview exists
      await tick();
      if (videoPreview) {
        videoPreview.srcObject = stream;
        videoPreview.play().catch(() => {});
      }

      // Add tracks to ALL existing peers and send offers explicitly
      for (const [viewerId, pc] of peers) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        await sendOffer(pc, viewerId);
      }

      // Apply bitrate limit to all video senders
      for (const [viewerId, pc] of peers) {
        const senders = pc.getSenders();
        for (const sender of senders) {
          if (sender.track?.kind === 'video') {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = preset.bitrate;
            await sender.setParameters(params);
          }
        }
      }

      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (e) {
      error = 'No se pudo iniciar la compartición de pantalla';
      setTimeout(() => { error = ''; }, 5000);
    }
  }

  function stopSharing() {
    if (isRecording) stopRecording();
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
    isSharing = false;

    peers.forEach(pc => pc.close());
    peers = new Map();

    if (socket && connected) {
      socket.emit('host:sharing-stopped', { roomId });
    }
  }

  function toggleMute() {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    isMuted = !isMuted;
  }

  function toggleFullscreen() {
    const el = document.querySelector('#video-container');
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      isFullscreen = false;
    } else {
      el.requestFullscreen();
      isFullscreen = true;
    }
  }

  // ─── Clipboard ──────────────────────────────────────────────────────
  async function copyToClipboard(text, type) {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'pin') { copiedPin = true; setTimeout(() => { copiedPin = false; }, 2000); }
      if (type === 'url') { copiedUrl = true; setTimeout(() => { copiedUrl = false; }, 2000); }
    } catch {
      error = 'No se pudo copiar al portapapeles';
      setTimeout(() => { error = ''; }, 3000);
    }
  }

  // ─── Navigation ─────────────────────────────────────────────────────
  function leaveRoom() {
    stopSharing();
    if (socket) {
      socket.emit('host:leave-room', { roomId });
      socket.disconnect();
    }
    goto('/');
  }

  // ─── Init ───────────────────────────────────────────────────────────
  initSocket();
</script>

<!-- Loading Overlay -->
{#if loading}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-opacity duration-500">
    <div class="text-center">
      <div class="relative mb-6">
        <div class="w-16 h-16 border-4 border-slate-600 border-t-red-500 rounded-full animate-spin mx-auto"></div>
        <Eye class="w-7 h-7 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <h2 class="text-xl font-semibold text-white mb-2">Preparando sala...</h2>
      <p class="text-slate-400 text-sm">Creando sala segura para tu transmisión</p>
    </div>
  </div>
{/if}

<!-- Error Banner -->
{#if error}
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg animate-[fadeIn_0.3s_ease]">
    <AlertTriangle class="w-4 h-4" />
    <span class="text-sm font-medium">{error}</span>
  </div>
{/if}
<!-- First Viewer Celebration -->
{#if showFirstViewerCelebration}
  <div class="fixed inset-0 z-[60] pointer-events-none animate-[fadeIn_0.3s_ease]">
    <!-- Confetti particles -->
    {#each confettiParticles as p (p.id)}
      <div
        class="absolute"
        style="
          left: {p.x}%;
          top: -20px;
          width: {p.size}px;
          height: {p.size}px;
          background: {p.type === 'rect' ? p.color : 'transparent'};
          border-radius: {p.borderRadius};
          animation: confettiFall {p.duration}s ease-in {p.delay}s forwards;
          opacity: 0;
          transform: rotate({p.rotation}deg);
          font-size: {p.size * 1.5}px;
          line-height: 1;
        "
      >
        {#if p.type === 'emoji'}{p.emoji}{/if}
      </div>
    {/each}

    <!-- Celebration message -->
    <div class="fixed inset-0 flex items-center justify-center">
      <div class="bg-white/95 backdrop-blur-md rounded-3xl px-8 py-6 shadow-2xl border border-slate-200 text-center animate-[celebrationPop_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        <div class="text-5xl mb-3">🎉</div>
        <h2 class="text-xl font-bold text-slate-800 mb-1">¡Primer espectador!</h2>
        <p class="text-sm text-slate-500">Alguien está viendo tu pantalla</p>
        <div class="mt-3 flex items-center justify-center gap-1.5">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-xs text-green-600 font-medium">En vivo</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Leave Confirmation Modal -->
{#if showLeaveModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-[scaleIn_0.2s_ease]">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle class="w-5 h-5 text-red-600" />
        </div>
        <h3 class="text-lg font-semibold text-slate-800">¿Salir de la sala?</h3>
      </div>
      <p class="text-slate-500 text-sm mb-6">
        Se cerrará la conexión con todos los espectadores y la sala será eliminada permanentemente.
      </p>
      <div class="flex gap-3">
        <button
          onclick={() => { showLeaveModal = false; }}
          class="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <button
          onclick={leaveRoom}
          class="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 active:scale-95 transition-all"
        >
          Salir
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Main Container -->
<div class="min-h-screen bg-slate-50 flex flex-col">
  <!-- Top Bar -->
  <header class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <button
        onclick={() => { showLeaveModal = true; }}
        class="p-2 hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
        title="Volver"
      >
        <ArrowLeft class="w-5 h-5 text-slate-600" />
      </button>
      <div class="flex items-center gap-2">
        <Monitor class="w-6 h-6 text-slate-800" />
        <span class="font-bold text-slate-800 text-lg tracking-tight">Wachaut</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      {#if isSharing}
        <div class="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full animate-[fadeIn_0.3s_ease]">
          <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span class="text-red-600 text-sm font-semibold">EN VIVO</span>
        </div>
      {/if}
      <div class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
        <Users class="w-4 h-4 text-slate-500" />
        <span class="text-slate-700 text-sm font-medium">{viewerCount}</span>
      </div>
      <button
        onclick={() => { showChat = !showChat; }}
        class="relative p-2 hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
        title="Chat"
      >
        <MessageCircle class="w-5 h-5 text-slate-600" />
        {#if chatMessages.length > 0 && !showChat}
          <div class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span class="text-[10px] text-white font-bold">{chatMessages.length > 9 ? '9+' : chatMessages.length}</span>
          </div>
        {/if}
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Video Area -->
    <div class="flex-1 relative" id="video-container">
      <!-- Video Element (shown when sharing) -->
      {#if isSharing && localStream}
        <video
          autoplay
          playsinline
          muted
          bind:this={videoPreview}
          class="w-full h-full object-contain bg-slate-900"
        ></video>
      {:else}
        <!-- Placeholder -->
        <div class="w-full h-full flex flex-col items-center justify-center bg-slate-100">
          <div class="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
            <Monitor class="w-10 h-10 text-slate-400" />
          </div>
          <h3 class="text-slate-600 font-semibold mb-1">Sin transmisión</h3>
          <p class="text-slate-400 text-sm">Comparte tu pantalla para comenzar</p>
        </div>
      {/if}

      <!-- Floating Controls (when sharing) -->
      {#if isSharing}
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button
            onclick={toggleMute}
            class="p-2.5 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
            title={isMuted ? 'Activar micrófono' : 'Silenciar'}
          >
            {#if isMuted}
              <VolumeX class="w-5 h-5 text-red-400" />
            {:else}
              <Volume2 class="w-5 h-5 text-white" />
            {/if}
          </button>
          <button
            onclick={toggleFullscreen}
            class="p-2.5 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {#if isFullscreen}
              <Minimize class="w-5 h-5 text-white" />
            {:else}
              <Maximize class="w-5 h-5 text-white" />
            {/if}
          </button>
          {#if isRecording}
            <button
              onclick={stopRecording}
              class="p-2.5 bg-red-500/80 rounded-xl hover:bg-red-500 active:scale-95 transition-all flex items-center gap-1.5"
              title="Detener grabación"
            >
              <div class="w-2.5 h-2.5 bg-red-400 rounded-full animate-[pulseRecord_1s_ease-in-out_infinite]"></div>
              <span class="text-red-300 text-xs font-medium">{formatDuration(recordingDuration)}</span>
            </button>
          {:else}
            <button
              onclick={startRecording}
              class="p-2.5 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
              title="Grabar sesión"
            >
              <Circle class="w-5 h-5 text-red-400" />
            </button>
          {/if}
          <button
            onclick={stopSharing}
            class="p-2.5 bg-red-500/80 rounded-xl hover:bg-red-500 active:scale-95 transition-all"
            title="Detener compartición"
          >
            <StopCircle class="w-5 h-5 text-white" />
          </button>
        </div>
      {/if}

      <!-- Floating Reactions -->
      {#each [...activeReactions.values()] as reaction (reaction.id)}
        <div
          class="absolute text-4xl pointer-events-none select-none"
          style="left: {reaction.x}%; bottom: 80px; animation: floatUp 3s ease-out forwards;"
        >
          {reaction.emoji}
        </div>
      {/each}
    </div>

    <!-- Sidebar -->
    <aside class="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
      <!-- Room Info Section -->
      <div class="p-4 border-b border-slate-100 space-y-3">
        <h3 class="font-semibold text-slate-800 text-sm uppercase tracking-wider">Información de sala</h3>

        <!-- PIN Display -->
        <div class="bg-slate-50 rounded-xl p-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-slate-500 font-medium">PIN de acceso</span>
            <button
              onclick={() => copyToClipboard(pin, 'pin')}
              class="p-1 hover:bg-slate-200 rounded-lg active:scale-95 transition-all"
              title="Copiar PIN"
            >
              {#if copiedPin}
                <Check class="w-3.5 h-3.5 text-green-500" />
              {:else}
                <Copy class="w-3.5 h-3.5 text-slate-400" />
              {/if}
            </button>
          </div>
          <p class="text-2xl font-mono font-bold text-slate-800 tracking-[0.2em]">{pin}</p>
        </div>

        <!-- Room URL -->
        <div class="bg-slate-50 rounded-xl p-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-slate-500 font-medium">Enlace de sala</span>
            <button
              onclick={() => copyToClipboard(roomUrl, 'url')}
              class="p-1 hover:bg-slate-200 rounded-lg active:scale-95 transition-all"
              title="Copiar enlace"
            >
              {#if copiedUrl}
                <Check class="w-3.5 h-3.5 text-green-500" />
              {:else}
                <Link2 class="w-3.5 h-3.5 text-slate-400" />
              {/if}
            </button>
          </div>
          <p class="text-xs text-slate-600 truncate font-mono">{roomUrl}</p>
        </div>
      </div>

      <!-- Actions Section -->
      <div class="p-4 border-b border-slate-100 space-y-2">
        {#if !isSharing}
          <!-- Quality Settings Toggle -->
          <button
            onclick={() => { showSettings = !showSettings; }}
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all"
          >
            <Settings class="w-4 h-4" />
            Configurar calidad
            <span class="text-xs text-slate-400 ml-auto">{presets[qualityPreset].label}</span>
          </button>

          <!-- Quality Settings Panel -->
          {#if showSettings}
            <div class="space-y-2 p-3 bg-slate-50 rounded-xl">
              {#each Object.entries(presets) as [key, preset]}
                <button
                  onclick={() => { qualityPreset = key; showSettings = false; }}
                  class="w-full text-left p-3 rounded-xl border-2 transition-all {qualityPreset === key
                    ? 'border-slate-800 bg-white shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'}"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold text-slate-800 text-sm">{preset.label}</span>
                    {#if qualityPreset === key}
                      <div class="w-2 h-2 bg-slate-800 rounded-full"></div>
                    {/if}
                  </div>
                  <p class="text-xs text-slate-500 mb-1.5">{preset.desc}</p>
                  <div class="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>{preset.resolution.width}x{preset.resolution.height}</span>
                    <span>•</span>
                    <span>{preset.fps} FPS</span>
                    <span>•</span>
                    <span>{(preset.bitrate / 1_000_000).toFixed(1)} Mbps</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          <button
            onclick={startSharing}
            class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl font-medium text-sm hover:bg-slate-700 active:scale-95 transition-all"
          >
            <Share2 class="w-4 h-4" />
            Compartir pantalla
          </button>
        {:else}
          <button
            onclick={stopSharing}
            class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 active:scale-95 transition-all"
          >
            <StopCircle class="w-4 h-4" />
            Detener transmisión
          </button>
        {/if}

        <!-- Recording Button (visible when sharing) -->
        {#if isSharing}
          {#if isRecording}
            <button
              onclick={stopRecording}
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 active:scale-95 transition-all"
            >
              <Square class="w-4 h-4" />
              <div class="w-2 h-2 bg-white rounded-full animate-[pulseRecord_1s_ease-in-out_infinite]"></div>
              Detener grabación
              <span class="text-red-200 text-xs">{formatDuration(recordingDuration)}</span>
            </button>
          {:else}
            <button
              onclick={startRecording}
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all"
            >
              <Circle class="w-4 h-4 text-red-500" />
              Grabar sesión
            </button>
          {/if}
        {/if}

        {#if isSharing}
          <div class="flex items-center justify-center gap-2 pt-2">
            {#each ['👍', '👎', '❓', '🎉'] as emoji}
              <button
                onclick={() => handleSendReaction(emoji)}
                class="w-10 h-10 flex items-center justify-center text-xl bg-slate-100 rounded-xl hover:bg-slate-200 active:scale-90 transition-all"
                title="Enviar reacción"
              >
                {emoji}
              </button>
            {/each}
          </div>
        {/if}

        <button
          onclick={() => { showLeaveModal = true; }}
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all"
        >
          <ArrowLeft class="w-4 h-4" />
          Cerrar sala
        </button>
      </div>

      <!-- Chat Panel -->
      <div class="flex-1 flex flex-col overflow-hidden min-h-0">
        <div class="px-4 py-3 flex items-center justify-between border-b border-slate-100">
          <div class="flex items-center gap-2">
            <MessageCircle class="w-4 h-4 text-slate-500" />
            <span class="text-sm font-semibold text-slate-700">Chat</span>
            <span class="text-xs text-slate-400">({chatMessages.length})</span>
          </div>
        </div>

        <!-- Messages -->
        <div
          bind:this={chatContainer}
          class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
        >
          {#if chatMessages.length === 0}
            <div class="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageCircle class="w-8 h-8 text-slate-300 mb-2" />
              <p class="text-slate-400 text-sm">Aún no hay mensajes</p>
              <p class="text-slate-300 text-xs mt-1">Los mensajes de los espectadores aparecerán aquí</p>
            </div>
          {:else}
            {#each chatMessages as msg (msg.id || msg.timestamp)}
              <div class="flex flex-col {msg.sender === 'Anfitrión' ? 'items-end' : 'items-start'}">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-[10px] font-semibold {msg.sender === 'Anfitrión' ? 'text-slate-600' : 'text-blue-500'}">
                    {msg.sender}
                  </span>
                  <span class="text-[10px] text-slate-300">
                    {msg.timestamp instanceof Date
                      ? msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
                <div class="max-w-[85%] px-3 py-2 rounded-2xl text-sm {msg.sender === 'Anfitrión'
                  ? 'bg-slate-800 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-700 rounded-bl-md'}">
                  {msg.text}
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <!-- Chat Input -->
        <div class="p-3 border-t border-slate-100">
          <div class="flex items-center gap-2">
            <input
              type="text"
              bind:value={chatInput}
              onkeydown={handleChatKeydown}
              placeholder="Escribe un mensaje..."
              maxlength="500"
              class="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
            />
            <button
              onclick={sendChatMessage}
              disabled={!chatInput.trim()}
              class="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Enviar mensaje"
            >
              <Send class="w-4 h-4" />
            </button>
          </div>
          <div class="flex items-center justify-between mt-1.5">
            <span class="text-[10px] text-slate-400">{chatInput.length}/500</span>
            <span class="text-[10px] text-slate-400">Enter para enviar</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</div>

<style>
  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    50% {
      opacity: 1;
      transform: translateY(-60px) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translateY(-140px) scale(0.8);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes pulseRecord {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.3); }
  }

  @keyframes confettiFall {
    0% {
      opacity: 1;
      transform: translateY(0) rotate(0deg) scale(1);
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(100vh) rotate(720deg) scale(0.3);
    }
  }

  @keyframes celebrationPop {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes celebrationFadeOut {
    0% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
