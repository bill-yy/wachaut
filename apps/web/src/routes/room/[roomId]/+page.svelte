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
      Volume1,
      VolumeX,
      MessageCircle,
      Send,
      Activity,
      Share2,
      User,
      Users,
      HelpCircle,
      MessageSquare,
      Bell,
      BellOff,
      SmilePlus
    } from 'lucide-svelte';
  import {
    playViewerJoin,
    playViewerLeave,
    playHostMuted,
    playChatMessage,
    isMuted as isNotifMuted,
    setMuted as setNotifMuted
  } from '$lib/notificationSounds';

  const roomId = $derived($page.params.roomId);

  // --- Connection state ---
  let status = $state('idle'); // idle, connecting, auth, waiting, live, error, disconnected
  let errorMessage = $state('');
  let pin = $state('');
  let username = $state('');
  let assignedUsername = $state('');
  const USERNAME_STORAGE_KEY = 'wachaut.viewer.username';

  // --- Socket & WebRTC ---
  let socket = $state(null);
  let peer = $state(null);
  let pendingStream = $state(null);
  let iceServers = $state(null);
  let pendingCandidates = [];

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
      console.log('[viewer] ICE servers loaded:', iceServers.map(s => s.urls));
      return iceServers;
    } catch (e) {
      console.error('[viewer] Failed to fetch TURN credentials, falling back to STUN:', e);
      iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];
      return iceServers;
    }
  }

  // --- Video ---
  let videoEl = $state(null);
  let isMuted = $state(true);
  let volume = $state(100);
  let isFullscreen = $state(false);
  let isHovering = $state(false);
  let hostMuted = $state(false);

  // --- Chat ---
  let chatMessages = $state([]);
  let chatInput = $state('');
  let chatContainer = $state(null);

  // --- Mobile & Keyboard Shortcuts ---
  let chatOpen = $state(false);
  let showShortcuts = $state(false);
  let chatInputEl = $state(null);
  let shortcutsTimeout = $state(null);

  // --- Connection Stats ---
  let connectionStats = $state({ resolution: '', fps: '', bitrate: '' });
  let statsInterval = $state(null);
  let lastBytesReceived = $state(0);
  let lastStatsTime = $state(0);

  // --- Reactions ---
  const ALL_EMOTES = [
    // Reactions
    '👍', '👎', '❤️', '🔥', '👏', '😂', '🎉', '😮', '😢', '😡',
    // Gestures
    '👋', '✌️', '💪', '🙏',
    // Objects
    '⭐', '💯', '🎯', '💡', '🎵',
    // Food
    '☕', '🍕', '🎂'
  ];
  const EMOTE_CATEGORIES = [
    { label: 'Reacciones', emojis: ['👍', '👎', '❤️', '🔥', '👏', '😂', '🎉', '😮', '😢', '😡'] },
    { label: 'Gestos', emojis: ['👋', '✌️', '💪', '🙏'] },
    { label: 'Objetos', emojis: ['⭐', '💯', '🎯', '💡', '🎵'] },
    { label: 'Comida', emojis: ['☕', '🍕', '🎂'] }
  ];
  let showEmotePicker = $state(false);
  let favoriteEmojis = $state(loadFavorites());
  let animatingReaction = $state(null);
  let floatingReactions = $state([]);
  let reactionCounter = 0;

  // --- Notifications ---
  let notificationsMuted = $state(isNotifMuted());
  function toggleNotificationsMuted() {
    notificationsMuted = !notificationsMuted;
    setNotifMuted(notificationsMuted);
  }

  const FAVORITES_KEY = 'wachaut.viewer.favorites';
  function loadFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY));
      if (Array.isArray(stored) && stored.length >= 5) return stored.slice(0, 5);
    } catch { /* ignore */ }
    return ['👍', '❤️', '🔥', '👏', '😂'];
  }
  function saveFavorites(emojis) {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(emojis.slice(0, 5)));
    } catch { /* ignore */ }
  }
  function trackFavorite(emoji) {
    const current = [...favoriteEmojis];
    const idx = current.indexOf(emoji);
    if (idx !== -1) {
      current.splice(idx, 1);
    }
    current.unshift(emoji);
    favoriteEmojis = current.slice(0, 5);
    saveFavorites(favoriteEmojis);
  }

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

  let statusColor = $derived.by(() => {
    if (status === 'live') return 'bg-red-500';
    if (isConnected) return 'bg-green-500';
    return 'bg-slate-500';
  });

  // --- Effects ---

  // Attach pending stream to video element when both are available
  $effect(() => {
    if (pendingStream && videoEl) {
      videoEl.srcObject = pendingStream;
      videoEl.volume = volume / 100;
      videoEl.muted = isMuted;
      videoEl.play().catch(() => {});
      pendingStream = null;
    }
  });

  // Auto-scroll chat when new messages arrive
  $effect(() => {
    if (chatMessages.length > 0 && chatContainer) {
      tick().then(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }
  });

  // --- Functions ---

  async function connect() {
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

    // Preload ICE servers before joining so peer creation is synchronous
    await fetchIceServers();

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
    socket = io(wsUrl, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      socket.emit('viewer:join', { roomId, pin, username: cleanedUsername });
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

    socket.on('room:joined', (data) => {
      assignedUsername = data?.username || cleanedUsername;
      username = assignedUsername;
      saveUsername(assignedUsername);
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
      try { playChatMessage(); } catch {}
    });

    // Reactions
    socket.on('reaction:receive', (data) => {
      addFloatingReaction(data.emoji);
    });

    // WebRTC signaling — server protocol: { signal } objects
    socket.on('host:signal', async (data) => {
      if (!peer) {
        peer = new RTCPeerConnection({ iceServers });

        peer.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            if (videoEl) {
              videoEl.srcObject = remoteStream;
              videoEl.volume = volume / 100;
              videoEl.muted = isMuted;
              videoEl.play().catch(() => {});
            } else {
              pendingStream = remoteStream;
            }
            status = 'live';
            startStatsPolling();
            showShortcutsOverlay();
            if (window.innerWidth < 768) {
              chatOpen = true;
            }
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('viewer:signal', { signal: event.candidate });
          }
        };

        peer.onconnectionstatechange = () => {
          console.log(`[viewer] connectionState=${peer.connectionState} iceState=${peer.iceConnectionState}`);
          if (peer.connectionState === 'disconnected' ||
              peer.connectionState === 'failed') {
            status = 'waiting';
          }
        };

        peer.oniceconnectionstatechange = () => {
          console.log(`[viewer] iceConnectionState=${peer.iceConnectionState}`);
        };
      }

      // data.signal is RTCSessionDescriptionInit or RTCIceCandidateInit
      const sig = data.signal;
      if (!sig) return;

      if (sig.type === 'offer') {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(sig));
          // Apply any candidates that arrived before the offer
          for (const candidate of pendingCandidates) {
            await peer.addIceCandidate(candidate);
          }
          pendingCandidates = [];
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('viewer:signal', { signal: peer.localDescription });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      } else if (sig.candidate) {
        try {
          const candidate = new RTCIceCandidate(sig);
          if (peer.remoteDescription) {
            await peer.addIceCandidate(candidate);
          } else {
            pendingCandidates.push(candidate);
          }
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
      pendingCandidates = [];
      if (videoEl) {
        videoEl.srcObject = null;
      }
      status = 'waiting';
    });

    socket.on('host:muted', () => {
      hostMuted = true;
      try { playHostMuted(); } catch {}
    });

    socket.on('host:unmuted', () => {
      hostMuted = false;
    });

    socket.on('viewer:kicked', (data) => {
      errorMessage = data?.reason || 'Has sido expulsado de la sala';
      status = 'error';
      cleanupSocket();
    });

    socket.on('host:disconnected', () => {
      errorMessage = 'El anfitrión se desconectó';
      status = 'error';
      if (peer) {
        peer.close();
        peer = null;
      }
      pendingCandidates = [];
    });

    socket.on('room:closed', () => {
      errorMessage = 'La sala se cerró';
      status = 'error';
      if (peer) {
        peer.close();
        peer = null;
      }
      pendingCandidates = [];
    });

    socket.on('disconnect', () => {
      if (status !== 'error') {
        status = 'disconnected';
      }
    });
  }

  function disconnect() {
    stopStatsPolling();
    if (peer) {
      peer.close();
      peer = null;
    }
    pendingCandidates = [];
    cleanupSocket();
    if (videoEl) {
      videoEl.srcObject = null;
    }
    status = 'idle';
    pin = '';
    assignedUsername = '';
    // Don't clear chatMessages on disconnect so they persist if reconnecting
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

  function handlePinInput(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    pin = val;
  }

  function handlePinKeydown(e) {
    if (e.key === 'Enter' && pin.length >= 4 && username.trim().length >= 2) {
      connect();
    }
  }

  function sanitizeUsername(value) {
    return value
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 24);
  }

  function handleUsernameInput(e) {
    username = sanitizeUsername(e.target.value);
  }

  function saveUsername(value) {
    try {
      localStorage.setItem(USERNAME_STORAGE_KEY, value);
    } catch {
      // Ignore private browsing/storage failures.
    }
  }

  function toggleMute() {
    if (videoEl) {
      if (videoEl.muted && volume === 0) {
        volume = 50;
        videoEl.volume = 0.5;
      }
      videoEl.muted = !videoEl.muted;
      isMuted = videoEl.muted;
    }
  }

  function handleVolumeInput(e) {
    volume = Number(e.target.value);
    if (videoEl) {
      videoEl.volume = volume / 100;
      videoEl.muted = volume === 0;
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

    // Chat commands
    if (text.startsWith('/')) {
      const parts = text.split(/\s+/);
      const command = parts[0].toLowerCase();
      switch (command) {
        case '/help':
          addSystemMessage('Comandos: /help, /stats, /clear');
          chatInput = '';
          return;
        case '/stats':
          addSystemMessage(`Estado: ${getStatusLabel(status)} | Resolución: ${connectionStats.resolution || 'N/A'} | FPS: ${connectionStats.fps || 'N/A'} | Bitrate: ${connectionStats.bitrate || 'N/A'}`);
          chatInput = '';
          return;
        case '/clear':
          chatMessages = [];
          addSystemMessage('Chat limpiado.');
          chatInput = '';
          return;
      }
    }

    socket.emit('chat:message', { text });
    chatInput = '';
  }

  function addSystemMessage(text) {
    chatMessages = [...chatMessages, {
      id: `system-${Date.now()}`,
      sender: 'Sistema',
      text,
      timestamp: new Date().toISOString()
    }];
  }

  function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }

  function sendReaction(emoji) {
    if (!socket) return;
    if (!ALL_EMOTES.includes(emoji)) return;
    trackFavorite(emoji);
    showEmotePicker = false;
    // Show locally immediately
    addFloatingReaction(emoji);
    // Send to server for others
    socket.emit('reaction:send', { emoji });
    animatingReaction = emoji;
    setTimeout(() => {
      if (animatingReaction === emoji) {
        animatingReaction = null;
      }
    }, 600);
  }

  function addFloatingReaction(emoji) {
    if (!ALL_EMOTES.includes(emoji)) return;
    const id = ++reactionCounter;
    const reaction = {
      id,
      emoji,
      x: Math.random() * 85 + 5,
      wobble: (Math.random() - 0.5) * 80,
      scale: 0.8 + Math.random() * 0.8,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1.5,
      createdAt: Date.now()
    };
    floatingReactions = [...floatingReactions, reaction];
    setTimeout(() => {
      floatingReactions = floatingReactions.filter(r => r.id !== id);
    }, (reaction.duration + reaction.delay) * 1000 + 200);
  }

  function retry() {
    status = 'idle';
    errorMessage = '';
    // Don't clear pin so user can reconnect with same PIN
  }

  async function updateStats() {
    if (!peer || status !== 'live') return;
    try {
      const stats = await peer.getStats();
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          connectionStats.resolution = `${report.frameWidth || '?'}x${report.frameHeight || '?'}`;
          connectionStats.fps = `${report.framesPerSecond || '?'}`;
          const now = Date.now();
          const bytesReceived = report.bytesReceived || 0;
          if (lastStatsTime > 0) {
            const elapsed = (now - lastStatsTime) / 1000;
            const deltaBytes = bytesReceived - lastBytesReceived;
            const bps = (deltaBytes * 8) / elapsed;
            if (bps >= 1000000) {
              connectionStats.bitrate = `${(bps / 1000000).toFixed(1)} Mbps`;
            } else if (bps >= 1000) {
              connectionStats.bitrate = `${(bps / 1000).toFixed(0)} Kbps`;
            } else {
              connectionStats.bitrate = `${Math.round(bps)} bps`;
            }
          }
          lastBytesReceived = bytesReceived;
          lastStatsTime = now;
        }
      });
    } catch (err) {
      console.error('Error getting stats:', err);
    }
  }

  function startStatsPolling() {
    stopStatsPolling();
    lastBytesReceived = 0;
    lastStatsTime = 0;
    connectionStats = { resolution: '', fps: '', bitrate: '' };
    statsInterval = setInterval(updateStats, 3000);
  }

  function stopStatsPolling() {
    if (statsInterval) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Únete a mi pantalla', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  // --- Keyboard Shortcuts ---
  function handleKeydown(e) {
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

    // '/' focuses chat input when not in an input
    if (e.key === '/' && !isInput && status === 'live') {
      e.preventDefault();
      if (chatInputEl) chatInputEl.focus();
      return;
    }

    // Enter sends chat message when chat input is focused
    if (e.key === 'Enter' && !e.shiftKey && isInput && document.activeElement === chatInputEl) {
      e.preventDefault();
      sendChatMessage();
      return;
    }

    // Don't process single-key shortcuts when typing in inputs
    if (isInput) return;

    if (status !== 'live') return;

    switch (e.key.toLowerCase()) {
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'escape':
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          isFullscreen = false;
        }
        break;
    }
  }

  function showShortcutsOverlay() {
    showShortcuts = true;
    if (shortcutsTimeout) clearTimeout(shortcutsTimeout);
     shortcutsTimeout = setTimeout(() => {
      showShortcuts = false;
    }, 3000);
  }

  function toggleChat() {
    chatOpen = !chatOpen;
  }

  // Show shortcuts overlay when entering live mode
  // NOTE: moved to host:signal handler to avoid effect_update_depth_exceeded
  // (writing chatOpen inside an $effect that reads status causes infinite loop)
  onDestroy(() => {
    if (shortcutsTimeout) clearTimeout(shortcutsTimeout);
    stopStatsPolling();
    disconnect();
  });

  onMount(() => {
    try {
      username = localStorage.getItem(USERNAME_STORAGE_KEY) || '';
    } catch {
      username = '';
    }
  });
</script>

<style>
  @keyframes floatUp {
    0% { opacity: 1; transform: translateY(0) translateX(0) scale(0.3) rotate(0deg); }
    15% { opacity: 1; transform: translateY(-30px) translateX(5px) scale(1.1) rotate(-5deg); }
    30% { opacity: 1; transform: translateY(-70px) translateX(-8px) scale(1.3) rotate(8deg); }
    60% { opacity: 0.8; transform: translateY(-150px) translateX(12px) scale(1.1) rotate(-3deg); }
    100% { opacity: 0; transform: translateY(-280px) translateX(-5px) scale(0.6) rotate(10deg); }
  }

  /* Custom volume slider */
  input[type="range"].volume-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,0.2);
    outline: none;
    cursor: pointer;
  }
  input[type="range"].volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
  input[type="range"].volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
</style>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-slate-950 text-slate-100">
  <!-- Non-live states: centered cards -->
  {#if status !== 'live'}
    <header class="bg-slate-900 border-b border-slate-800 px-4 py-3 shadow-sm">
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
          <Monitor class="h-3.5 w-3.5 text-slate-900" />
        </div>
        <span class="text-lg font-bold text-white">Wachaut</span>
        <div class="flex-1"></div>
        <button
          onclick={toggleNotificationsMuted}
          class="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          title={notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
        >
          {#if notificationsMuted}
            <BellOff class="w-5 h-5 text-slate-500" />
          {:else}
            <Bell class="w-5 h-5 text-slate-300" />
          {/if}
        </button>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-6">
      <!-- IDLE: PIN + Username Input -->
      {#if status === 'idle'}
        <div class="flex items-center justify-center" style="min-height: 60vh;">
          <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-200">
            <div class="flex flex-col items-center mb-6">
              <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Lock class="w-7 h-7 text-slate-600" />
              </div>
              <h2 class="text-lg font-semibold text-slate-800">Unirse a la sala</h2>
              <p class="text-sm text-slate-500 mt-1">Ingresa tu nombre y el PIN de acceso</p>
            </div>

            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Nombre</label>
            <div class="relative mb-4">
              <User class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="tu-nombre"
                value={username}
                oninput={handleUsernameInput}
                onkeydown={handlePinKeydown}
                maxlength="24"
                autocomplete="username"
                class="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4
                       text-sm font-semibold text-slate-800 placeholder:text-slate-300
                       focus:outline-none focus:ring-2 focus:ring-slate-400
                       focus:border-transparent transition-all"
              />
            </div>

            <label class="block text-xs font-semibold text-slate-500 mb-1.5">PIN</label>
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
              disabled={pin.length < 4 || username.trim().length < 2}
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
        <div class="flex items-center justify-center" style="min-height: 60vh;">
          <div class="text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Wifi class="w-8 h-8 text-slate-400" />
            </div>
            <p class="text-slate-600 font-medium">
              {status === 'connecting' ? 'Conectando...' : 'Autenticando...'}
            </p>
            <p class="text-sm text-slate-400 mt-1">Verificando PIN con el anfitrión</p>
          </div>
        </div>

      <!-- WAITING -->
      {:else if status === 'waiting'}
        <div class="flex items-center justify-center" style="min-height: 60vh;">
          <div class="text-center">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor class="w-10 h-10 text-slate-400" />
            </div>
            <h2 class="text-lg font-semibold text-slate-700 mb-2">Esperando al anfitrión</h2>
            <p class="text-sm text-slate-500 mb-6">El anfitrión comenzará a compartir pronto</p>
            <button
              onclick={disconnect}
              class="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg
                     hover:bg-slate-300 transition-colors text-sm font-medium"
            >
              Salir de la sala
            </button>
          </div>
        </div>

      <!-- ERROR -->
      {:else if status === 'error'}
        <div class="flex items-center justify-center" style="min-height: 60vh;">
          <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200">
            <div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle class="w-7 h-7 text-red-500" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 mb-2">Error</h2>
            <p class="text-sm text-slate-500 mb-6">{errorMessage}</p>
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
        <div class="flex items-center justify-center" style="min-height: 60vh;">
          <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200">
            <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff class="w-7 h-7 text-slate-400" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 mb-2">Desconectado</h2>
            <p class="text-sm text-slate-500 mb-6">Se perdió la conexión con el servidor</p>
            <button
              onclick={() => connect()}
              class="px-6 py-3 bg-slate-800 text-white font-medium
                     rounded-xl hover:bg-slate-700 transition-colors"
            >
              Reconectar
            </button>
          </div>
        </div>
      {/if}
    </main>

  <!-- LIVE: Twitch/Discord layout -->
  {:else}
    <div class="flex flex-col md:flex-row h-[calc(100vh-49px)] overflow-hidden">
      <!-- Video Area (left, flex-1) -->
      <div
        class="w-full h-[50vh] md:h-auto md:w-auto md:flex-1 relative bg-black group shrink-0 md:shrink"
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

        <!-- Top-left overlays -->
        <div class="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <!-- Live Badge -->
          <div class="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
            <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            EN VIVO
          </div>
          <!-- Host Muted Indicator -->
          {#if hostMuted}
            <div class="flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium animate-[floatUp_0.3s_ease]">
              <VolumeX class="w-3 h-3" />
              Silenciado
            </div>
          {/if}
          <!-- Username badge -->
          {#if assignedUsername}
            <div class="hidden md:flex items-center gap-1 bg-slate-800/80 backdrop-blur-sm text-slate-300 px-2 py-1 rounded-full text-xs font-medium">
              <User class="w-3 h-3" />
              {assignedUsername}
            </div>
          {/if}
        </div>

        <!-- Bottom controls (on hover) -->
        <div
          class="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10
                 bg-gradient-to-t from-black/80 via-black/40 to-transparent
                 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                 pointer-events-none"
        >
          <div class="flex items-center gap-3 pointer-events-auto">
            <!-- Mute button -->
            <button
              onclick={toggleMute}
              class="text-white hover:text-white/80 transition-colors p-1"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {#if isMuted || volume === 0}
                <VolumeX class="w-5 h-5" />
              {:else if volume < 50}
                <Volume1 class="w-5 h-5" />
              {:else}
                <Volume2 class="w-5 h-5" />
              {/if}
            </button>

            <!-- Volume slider -->
            <div class="hidden md:flex items-center gap-2 flex-1 max-w-[160px]">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                oninput={handleVolumeInput}
                class="volume-slider flex-1"
                title="Volumen: {volume}%"
              />
              <span class="text-white/60 text-[10px] font-mono w-8 text-right">{volume}%</span>
            </div>

            <div class="flex-1"></div>

            <!-- Share -->
            <button
              onclick={shareLink}
              class="text-white/70 hover:text-white transition-colors p-1"
              title="Compartir enlace"
            >
              <Share2 class="w-4 h-4" />
            </button>

            <!-- Fullscreen -->
            <button
              onclick={toggleFullscreen}
              class="text-white/70 hover:text-white transition-colors p-1"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {#if isFullscreen}
                <Minimize class="w-5 h-5" />
              {:else}
                <Maximize class="w-5 h-5" />
              {/if}
            </button>
            <!-- Shortcuts help -->
            <button
              onclick={showShortcutsOverlay}
              class="text-white/50 hover:text-white/80 transition-colors p-1 text-xs font-mono"
              title="Atajos de teclado"
            >
              ?
            </button>
          </div>
        </div>

        <!-- Floating Reactions -->
        {#each floatingReactions as reaction (reaction.id)}
          <div
            class="absolute text-3xl pointer-events-none select-none"
            style="left: {reaction.x}%; bottom: 80px; font-size: {reaction.scale * 2}rem; animation: floatUp {reaction.duration}s ease-out {reaction.delay}s forwards; opacity: 0;"
          >
            {reaction.emoji}
          </div>
        {/each}
      </div>

      <!-- Chat Sidebar (right, fixed width) -->
      <aside class="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0
                     max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50
                     max-md:w-80 max-md:transition-transform max-md:duration-300
                     {chatOpen ? 'max-md:translate-x-0' : 'max-md:translate-x-full'}">
        <!-- Chat Header -->
        <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <MessageCircle class="w-4 h-4 text-slate-400" />
            <span class="text-sm font-semibold text-slate-200">Chat</span>
            <span class="text-xs text-slate-500">({chatMessages.length})</span>
          </div>
          <div class="flex items-center gap-2">
            <!-- Connection stats -->
            {#if connectionStats.resolution}
              <div class="flex items-center gap-1 text-[10px] text-slate-500">
                <Activity class="w-3 h-3" />
                <span>{connectionStats.resolution}</span>
                {#if connectionStats.bitrate}
                  <span>· {connectionStats.bitrate}</span>
                {/if}
              </div>
            {/if}
            <button
              onclick={toggleNotificationsMuted}
              class="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title={notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
            >
              {#if notificationsMuted}
                <BellOff class="w-4 h-4 text-slate-600" />
              {:else}
                <Bell class="w-4 h-4 text-slate-400" />
              {/if}
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div
          bind:this={chatContainer}
          class="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0"
        >
          {#if chatMessages.length === 0}
            <div class="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle class="w-8 h-8 text-slate-700 mb-2" />
              <p class="text-slate-500 text-sm">No hay mensajes aún</p>
              <p class="text-slate-600 text-xs mt-1">Los mensajes aparecerán aquí</p>
            </div>
          {/if}

          {#each chatMessages as msg (msg.id)}
            <div class="flex flex-col {msg.sender === 'Sistema' ? 'items-center' : ''}">
              {#if msg.sender !== 'Sistema'}
                <div class="flex items-baseline gap-2">
                  <span class="text-xs font-semibold
                    {msg.sender === 'Anfitrión' ? 'text-amber-400' : 'text-slate-300'}">
                    {msg.sender}
                  </span>
                  <span class="text-slate-600 text-[10px]">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              {/if}
              <p class="{msg.sender === 'Sistema'
                ? 'text-slate-500 text-xs italic bg-slate-800/50 px-3 py-1 rounded-lg'
                : msg.sender === 'Anfitrión'
                  ? 'text-slate-100 text-sm'
                  : 'text-slate-300 text-sm'} mt-0.5 break-words">
                {msg.text}
              </p>
            </div>
          {/each}
        </div>

        <!-- Reactions Row -->
        <div class="px-4 py-2 border-t border-slate-800 shrink-0 relative">
          <!-- Favorites row -->
          <div class="flex items-center justify-center gap-1.5">
            {#each favoriteEmojis as emoji}
              <button
                onclick={() => sendReaction(emoji)}
                class="w-9 h-9 flex items-center justify-center text-lg
                       bg-slate-800/50 rounded-lg
                       hover:bg-slate-700/70 active:scale-90
                       transition-all duration-150
                       {animatingReaction === emoji ? 'scale-125 bg-slate-700' : ''}"
                title="Enviar reacción"
              >
                {emoji}
              </button>
            {/each}
            <button
              onclick={() => (showEmotePicker = !showEmotePicker)}
              class="w-9 h-9 flex items-center justify-center text-lg
                     bg-slate-800/50 rounded-lg
                     hover:bg-slate-700/70 active:scale-90
                     transition-all duration-150
                     {showEmotePicker ? 'bg-slate-700 text-white' : 'text-slate-400'}"
              title="Más emojis"
            >
              <SmilePlus class="w-5 h-5" />
            </button>
          </div>

          <!-- Expandable emote grid -->
          {#if showEmotePicker}
            <div class="absolute bottom-full left-0 right-0 mb-2 mx-1
                        bg-slate-900 border border-slate-700 rounded-xl shadow-2xl
                        p-3 z-10 max-h-64 overflow-y-auto">
              {#each EMOTE_CATEGORIES as category}
                <div class="mb-2 last:mb-0">
                  <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                    {category.label}
                  </p>
                  <div class="grid grid-cols-5 gap-1">
                    {#each category.emojis as emoji}
                      <button
                        onclick={() => sendReaction(emoji)}
                        class="w-9 h-9 flex items-center justify-center text-lg
                               bg-slate-800/50 rounded-lg
                               hover:bg-slate-700/70 active:scale-90
                               transition-all duration-150"
                        title="Enviar {emoji}"
                      >
                        {emoji}
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Chat Input -->
        <div class="px-3 py-3 border-t border-slate-800 shrink-0">
          <div class="flex items-center gap-2">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={chatInput}
              oninput={(e) => (chatInput = e.target.value)}
              onkeydown={handleChatKeydown}
              class="flex-1 bg-slate-800 text-white text-sm px-3 py-2.5
                     rounded-lg border border-slate-700
                     focus:outline-none focus:border-slate-500
                     placeholder:text-slate-500 transition-colors"
            />
            <button
              onclick={sendChatMessage}
              disabled={!chatInput.trim()}
              class="w-9 h-9 bg-slate-700 text-white rounded-lg
                     flex items-center justify-center shrink-0
                     hover:bg-slate-600 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors"
            >
              <Send class="w-4 h-4" />
            </button>
          </div>
          <p class="text-[10px] text-slate-600 mt-1.5 px-1">/help para comandos</p>
        </div>
      </aside>

      <!-- Mobile chat toggle button -->
      <button
        onclick={toggleChat}
        class="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-800 text-white
               rounded-full shadow-xl flex items-center justify-center z-40
               hover:bg-slate-700 active:scale-95 transition-all"
        title={chatOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        <MessageCircle class="w-6 h-6" />
        {#if !chatOpen && chatMessages.length > 0}
          <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {chatMessages.length > 9 ? '9+' : chatMessages.length}
          </span>
        {/if}
      </button>

      <!-- Mobile backdrop -->
      {#if chatOpen}
        <div
          class="md:hidden fixed inset-0 bg-black/50 z-40"
          onclick={toggleChat}
          role="presentation"
        ></div>
      {/if}
    </div>
  {/if}
</div>
