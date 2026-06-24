<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { page } from '$app/stores';
  import { io } from 'socket.io-client';
  import {
    Monitor,
    Lock,
    Wifi,
    WifiOff,
    AlertTriangle,
    Maximize,
    Minimize,
    Volume2,
    VolumeX,
    MessageCircle,
    Send,
    SmilePlus
  } from 'lucide-svelte';

  const roomId = $derived($page.params.roomId);

  // --- Connection state ---
  let status = $state('idle'); // idle, connecting, auth, waiting, live, error, disconnected
  let errorMessage = $state('');
  let pin = $state('');

  // --- Socket & WebRTC ---
  let socket = $state(null);
  let peer = $state(null);
  let pendingStream = $state(null);

  // --- Video ---
  let videoEl = $state(null);
  let isMuted = $state(true);
  let isFullscreen = $state(false);
  let isHovering = $state(false);

  // --- Chat ---
  let chatOpen = $state(false);
  let chatMessages = $state([]);
  let chatInput = $state('');
  let chatContainer = $state(null);

  // --- Reactions ---
  const reactionEmojis = ['👍', '👎', '❓', '🎉'];
  let animatingReaction = $state(null);

  // --- Derived ---
  function getStatusLabel(s) {
    if (s === 'idle') return 'Desconectado';
    if (s === 'connecting') return 'Conectando...';
    if (s === 'auth') return 'Autenticando...';
    if (s === 'waiting') return 'Esperando transmisión';
    if (s === 'live') return 'En vivo';
    if (s === 'error') return 'Error';
    if (s === 'disconnected') return 'Desconectado';
    return '';
  }

  let isConnected = $derived(
    status === 'waiting' || status === 'live'
  );

  let statusColor = $derived(() => {
    if (status === 'live') return 'bg-red-500';
    if (isConnected) return 'bg-green-500';
    return 'bg-slate-500';
  });

  // --- Effects ---

  // Attach pending stream to video element when both are available
  $effect(() => {
    if (pendingStream && videoEl) {
      videoEl.srcObject = pendingStream;
      videoEl.play().catch(() => {});
      pendingStream = null;
    }
  });

  // Auto-scroll chat when new messages arrive
  $effect(() => {
    if (chatOpen && chatMessages.length > 0 && chatContainer) {
      tick().then(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }
  });

  // --- Functions ---

  function connect() {
    if (!pin || pin.length < 4) {
      errorMessage = 'Ingresa un PIN válido';
      status = 'error';
      return;
    }

    status = 'connecting';

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
    socket = io(wsUrl, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      socket.emit('viewer:join', { roomId, pin });
      status = 'auth';
    });

    socket.on('room:auth-success', () => {
      status = 'waiting';
    });

    socket.on('room:auth-failed', (data) => {
      errorMessage = data?.message || 'PIN incorrecto';
      status = 'error';
      cleanupSocket();
    });

    socket.on('room:error', (data) => {
      errorMessage = data?.message || 'Error en la sala';
      status = 'error';
      cleanupSocket();
    });

    socket.on('room:joined', () => {
      status = 'waiting';
    });

    // Chat events
    socket.on('chat:history', (data) => {
      if (data?.messages) {
        chatMessages = data.messages.map((msg) => ({
          id: msg.id || Date.now() + Math.random(),
          sender: msg.sender || 'Anónimo',
          text: msg.text,
          timestamp: msg.timestamp || new Date().toISOString()
        }));
      }
    });

    socket.on('chat:message', (msg) => {
      chatMessages = [
        ...chatMessages,
        {
          id: msg.id || Date.now(),
          sender: msg.sender || 'Anónimo',
          text: msg.text,
          timestamp: msg.timestamp || new Date().toISOString()
        }
      ];
    });

    // WebRTC signaling — server protocol: { signal } objects
    socket.on('host:signal', async (data) => {
      if (!peer) {
        peer = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });

        peer.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            if (videoEl) {
              videoEl.srcObject = remoteStream;
              videoEl.play().catch(() => {});
            } else {
              pendingStream = remoteStream;
            }
            status = 'live';
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('viewer:signal', { signal: event.candidate });
          }
        };

        peer.onconnectionstatechange = () => {
          if (peer.connectionState === 'disconnected' ||
              peer.connectionState === 'failed') {
            status = 'waiting';
          }
        };
      }

      // data.signal is RTCSessionDescriptionInit or RTCIceCandidateInit
      const sig = data.signal;
      if (!sig) return;

      if (sig.type === 'offer') {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(sig));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('viewer:signal', { signal: peer.localDescription });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      } else if (sig.candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(sig));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    socket.on('host:stopped-sharing', () => {
      if (peer) {
        peer.close();
        peer = null;
      }
      if (videoEl) {
        videoEl.srcObject = null;
      }
      status = 'waiting';
    });

    socket.on('host:disconnected', () => {
      errorMessage = 'El anfitrión se desconectó';
      status = 'error';
      if (peer) {
        peer.close();
        peer = null;
      }
    });

    socket.on('room:closed', () => {
      errorMessage = 'La sala se cerró';
      status = 'error';
      if (peer) {
        peer.close();
        peer = null;
      }
    });

    socket.on('disconnect', () => {
      if (status !== 'error') {
        status = 'disconnected';
      }
    });
  }

  function disconnect() {
    if (peer) {
      peer.close();
      peer = null;
    }
    cleanupSocket();
    if (videoEl) {
      videoEl.srcObject = null;
    }
    status = 'idle';
    pin = '';
    chatMessages = [];
    chatOpen = false;
    errorMessage = '';
  }

  function cleanupSocket() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  }

  function handlePinInput(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    pin = val;
  }

  function handlePinKeydown(e) {
    if (e.key === 'Enter' && pin.length >= 4) {
      connect();
    }
  }

  function toggleMute() {
    if (videoEl) {
      videoEl.muted = !videoEl.muted;
      isMuted = videoEl.muted;
    }
  }

  function toggleFullscreen() {
    if (!videoEl) return;

    if (!document.fullscreenElement) {
      videoEl.parentElement.requestFullscreen().then(() => {
        isFullscreen = true;
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen = false;
      }).catch(() => {});
    }
  }

  function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || !socket) return;

    socket.emit('chat:message', { text });
    chatInput = '';
  }

  function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }

  function sendReaction(emoji) {
    if (!socket) return;

    socket.emit('reaction:send', { emoji });
    animatingReaction = emoji;
    setTimeout(() => {
      if (animatingReaction === emoji) {
        animatingReaction = null;
      }
    }, 600);
  }

  function toggleChat() {
    chatOpen = !chatOpen;
  }

  function retry() {
    status = 'idle';
    errorMessage = '';
    pin = '';
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onDestroy(() => {
    disconnect();
  });
</script>

<div class="min-h-screen bg-slate-50">
  <!-- Header -->
  <header class="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
    <div class="max-w-5xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800">
          <Monitor class="h-3.5 w-3.5 text-white" />
        </div>
        <span class="text-lg font-bold text-slate-800">Wachaut</span>
      </div>
      <span class="text-xs text-slate-400">
        Sala: {roomId}
      </span>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-6">
    <!-- IDLE: PIN Input -->
    {#if status === 'idle'}
      <div
        class="flex items-center justify-center"
        style="min-height: 60vh;"
      >
        <div
          class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm
                 border border-slate-200"
        >
          <div class="flex flex-col items-center mb-6">
            <div
              class="w-14 h-14 bg-slate-100 rounded-full flex items-center
                     justify-center mb-4"
            >
              <Lock class="w-7 h-7 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800">
              Unirse a la sala
            </h2>
            <p class="text-sm text-slate-500 mt-1">
              Ingresa el PIN proporcionado por el anfitrión
            </p>
          </div>

          <input
            type="text"
            inputmode="numeric"
            placeholder="••••••"
            value={pin}
            oninput={handlePinInput}
            onkeydown={handlePinKeydown}
            maxlength="6"
            class="w-full text-center text-2xl tracking-[0.5em]
                   font-mono py-3 px-4 border border-slate-300
                   rounded-xl bg-slate-50 text-slate-800
                   focus:outline-none focus:ring-2 focus:ring-slate-400
                   focus:border-transparent transition-all
                   placeholder:text-slate-300"
          />

          <button
            onclick={connect}
            disabled={pin.length < 4}
            class="w-full mt-4 py-3 bg-slate-800 text-white font-medium
                   rounded-xl hover:bg-slate-700 disabled:opacity-40
                   disabled:cursor-not-allowed transition-colors"
          >
            Conectar
          </button>
        </div>
      </div>

    <!-- CONNECTING / AUTH -->
    {:else if status === 'connecting' || status === 'auth'}
      <div
        class="flex items-center justify-center"
        style="min-height: 60vh;"
      >
        <div class="text-center">
          <div
            class="w-16 h-16 bg-slate-100 rounded-full flex items-center
                   justify-center mx-auto mb-4 animate-pulse"
          >
            <Wifi class="w-8 h-8 text-slate-400" />
          </div>
          <p class="text-slate-600 font-medium">
            {status === 'connecting' ? 'Conectando...' : 'Autenticando...'}
          </p>
          <p class="text-sm text-slate-400 mt-1">
            Verificando PIN con el anfitrión
          </p>
        </div>
      </div>

    <!-- WAITING -->
    {:else if status === 'waiting'}
      <div
        class="flex items-center justify-center"
        style="min-height: 60vh;"
      >
        <div class="text-center">
          <div
            class="w-20 h-20 bg-slate-100 rounded-full flex items-center
                   justify-center mx-auto mb-4"
          >
            <Monitor class="w-10 h-10 text-slate-400" />
          </div>
          <h2 class="text-lg font-semibold text-slate-700 mb-2">
            Esperando al anfitrión
          </h2>
          <p class="text-sm text-slate-500 mb-6">
            El anfitrión comenzará a compartir pronto
          </p>

          <button
            onclick={disconnect}
            class="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg
                   hover:bg-slate-300 transition-colors text-sm font-medium"
          >
            Salir de la sala
          </button>
        </div>
      </div>

    <!-- LIVE -->
    {:else if status === 'live'}
      <div class="relative">
        <!-- Video Container -->
        <div
          class="relative rounded-2xl overflow-hidden bg-black
                 shadow-xl aspect-video"
          onmouseenter={() => (isHovering = true)}
          onmouseleave={() => (isHovering = false)}
          role="region"
          aria-label="Video en vivo"
        >
          <!-- Video Element -->
          <video
            bind:this={videoEl}
            autoplay
            muted
            playsinline
            onclick={() => { if (videoEl) { videoEl.muted = false; isMuted = false; } }}
            class="w-full h-full object-contain cursor-pointer"
            title="Haz clic para activar audio"
          ></video>

          <!-- Live Badge -->
          <div
            class="absolute top-4 left-4 flex items-center gap-2
                   bg-red-500/90 backdrop-blur-sm text-white px-3 py-1
                   rounded-full text-sm font-semibold"
          >
            <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            EN VIVO
          </div>

          <!-- Hover Controls -->
          {#if isHovering}
            <div
              class="absolute bottom-4 left-1/2 -translate-x-1/2
                     flex items-center gap-2 bg-black/60 backdrop-blur-sm
                     rounded-full px-4 py-2 transition-opacity"
            >
              <button
                onclick={toggleMute}
                class="text-white hover:text-slate-200 transition-colors p-1"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {#if isMuted}
                  <VolumeX class="w-5 h-5" />
                {:else}
                  <Volume2 class="w-5 h-5" />
                {/if}
              </button>

              <button
                onclick={toggleFullscreen}
                class="text-white hover:text-slate-200 transition-colors p-1"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {#if isFullscreen}
                  <Minimize class="w-5 h-5" />
                {:else}
                  <Maximize class="w-5 h-5" />
                {/if}
              </button>
            </div>
          {/if}
        </div>

        <!-- Reactions Row -->
        <div class="flex items-center justify-center gap-3 mt-4">
          {#each reactionEmojis as emoji}
            <button
              onclick={() => sendReaction(emoji)}
              class="w-12 h-12 bg-white border border-slate-200 rounded-xl
                     flex items-center justify-center text-xl
                     hover:bg-slate-100 hover:border-slate-300
                     transition-all duration-200
                     {animatingReaction === emoji ? 'scale-125' : ''}"
              title="Enviar reacción"
            >
              {emoji}
            </button>
          {/each}
        </div>

        <!-- Connection Info & Leave -->
        <div
          class="flex items-center justify-between mt-4 px-2"
        >
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <span
              class="w-2 h-2 rounded-full {statusColor}"
            ></span>
            <span>{getStatusLabel(status)}</span>
          </div>

          <button
            onclick={disconnect}
            class="px-4 py-1.5 bg-red-50 text-red-600 rounded-lg
                   hover:bg-red-100 transition-colors text-sm font-medium"
          >
            Salir
          </button>
        </div>
      </div>

    <!-- ERROR -->
    {:else if status === 'error'}
      <div
        class="flex items-center justify-center"
        style="min-height: 60vh;"
      >
        <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200">
          <div
            class="w-14 h-14 bg-red-50 rounded-full flex items-center
                   justify-center mx-auto mb-4"
          >
            <AlertTriangle class="w-7 h-7 text-red-500" />
          </div>
          <h2 class="text-lg font-semibold text-slate-800 mb-2">
            Error
          </h2>
          <p class="text-sm text-slate-500 mb-6">
            {errorMessage}
          </p>
          <button
            onclick={retry}
            class="px-6 py-3 bg-slate-800 text-white font-medium
                   rounded-xl hover:bg-slate-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>

    <!-- DISCONNECTED -->
    {:else if status === 'disconnected'}
      <div
        class="flex items-center justify-center"
        style="min-height: 60vh;"
      >
        <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200">
          <div
            class="w-14 h-14 bg-slate-100 rounded-full flex items-center
                   justify-center mx-auto mb-4"
          >
            <WifiOff class="w-7 h-7 text-slate-400" />
          </div>
          <h2 class="text-lg font-semibold text-slate-800 mb-2">
            Desconectado
          </h2>
          <p class="text-sm text-slate-500 mb-6">
            Se perdió la conexión con el servidor
          </p>
          <button
            onclick={retry}
            class="px-6 py-3 bg-slate-800 text-white font-medium
                   rounded-xl hover:bg-slate-700 transition-colors"
          >
            Reconectar
          </button>
        </div>
      </div>
    {/if}
  </main>

  <!-- Chat Toggle Button -->
  {#if status !== 'idle' && status !== 'connecting' && status !== 'auth'}
    <button
      onclick={toggleChat}
      class="fixed bottom-6 right-6 w-12 h-12 bg-slate-800 text-white
             rounded-full shadow-lg flex items-center justify-center
             hover:bg-slate-700 transition-all z-40
             {chatOpen ? 'ring-2 ring-slate-400' : ''}"
      title={chatOpen ? 'Cerrar chat' : 'Abrir chat'}
    >
      <MessageCircle class="w-5 h-5" />
      {#if !chatOpen && chatMessages.length > 0}
        <span
          class="absolute -top-1 -right-1 w-5 h-5 bg-red-500
                 text-white text-xs rounded-full flex items-center
                 justify-center font-bold"
        >
          {chatMessages.length > 9 ? '9+' : chatMessages.length}
        </span>
      {/if}
    </button>
  {/if}

  <!-- Chat Panel -->
  {#if chatOpen}
    <div
      class="fixed top-0 right-0 h-full w-full max-w-sm z-50
             bg-slate-900/95 backdrop-blur-md border-l border-slate-700
             flex flex-col"
    >
      <!-- Chat Header -->
      <div
        class="flex items-center justify-between px-4 py-3
               border-b border-slate-700"
      >
        <div class="flex items-center gap-2">
          <MessageCircle class="w-5 h-5 text-slate-300" />
          <span class="text-white font-semibold text-sm">Chat</span>
        </div>
        <button
          onclick={toggleChat}
          class="text-slate-400 hover:text-white transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      <!-- Messages -->
      <div
        bind:this={chatContainer}
        class="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {#if chatMessages.length === 0}
          <p class="text-slate-500 text-sm text-center mt-10">
            No hay mensajes aún
          </p>
        {/if}

        {#each chatMessages as msg (msg.id)}
          <div class="flex flex-col">
            <div class="flex items-baseline gap-2">
              <span class="text-slate-300 text-xs font-semibold">
                {msg.sender}
              </span>
              <span class="text-slate-600 text-[10px]">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            <p class="text-slate-200 text-sm mt-0.5 break-words">
              {msg.text}
            </p>
          </div>
        {/each}
      </div>

      <!-- Chat Input -->
      <div
        class="px-4 py-3 border-t border-slate-700"
      >
        <div class="flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={chatInput}
            oninput={(e) => (chatInput = e.target.value)}
            onkeydown={handleChatKeydown}
            class="flex-1 bg-slate-800 text-white text-sm px-4 py-2.5
                   rounded-xl border border-slate-700
                   focus:outline-none focus:border-slate-500
                   placeholder:text-slate-500 transition-colors"
          />
          <button
            onclick={sendChatMessage}
            disabled={!chatInput.trim()}
            class="w-10 h-10 bg-slate-700 text-white rounded-xl
                   flex items-center justify-center
                   hover:bg-slate-600 disabled:opacity-40
                   disabled:cursor-not-allowed transition-colors"
          >
            <Send class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
