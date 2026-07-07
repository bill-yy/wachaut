<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { io } from 'socket.io-client';
  import { SfuClient } from '$lib/sfu-client';
  import {
    playViewerJoin,
    playViewerLeave,
    playChatMessage,
    isMuted as isNotifMuted,
    setMuted as setNotifMuted
  } from '$lib/notificationSounds';

  // Components
  import HostHeader from '$lib/components/HostHeader.svelte';
  import VideoStage from '$lib/components/VideoStage.svelte';
  import RoomSidebar from '$lib/components/RoomSidebar.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import ReactionLayer from '$lib/components/ReactionLayer.svelte';
  import ViewersPanel from '$lib/components/ViewersPanel.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Spinner from '$lib/components/Spinner.svelte';

  // Shared utils
  import { ALL_EMOTES, loadFavorites, saveFavorites, trackFavorite } from '$lib/utils/emotes';
  import { SENDER_HOST, systemMessage, type ChatMessage } from '$lib/utils/chat';
  import { copyText } from '$lib/utils/clipboard';
  import { toast } from '$lib/stores/toast.svelte';
  import type { Viewer, FloatingReaction, ConfettiParticle } from '$lib/types/room';
  import type { QualityPreset } from '$lib/components/QualitySettings.svelte';
  import { AlertTriangle, Eye, Settings as SettingsIcon, Monitor, ArrowLeft } from 'lucide-svelte';

  // ─── State ───────────────────────────────────────────────────────────
  let socket: any = $state(null);
  let connected = $state(false);
  let isSharing = $state(false);
  let isMuted = $state(false);
  let isFullscreen = $state(false);
  let viewerCount = $state(0);
  let error = $state('');
  let showLeaveModal = $state(false);
  let loading = $state(true);
  let canScreenShare = $state(true);
  let copiedInvite = $state(false);

  let videoPreview: HTMLVideoElement | null = $state(null);
  let videoContainer: HTMLDivElement | null = $state(null);

  // WebRTC
  let localStream: MediaStream | null = $state(null);
  let sfuClient: any = $state(null);

  // Chat
  let chatMessages = $state<ChatMessage[]>([]);
  let chatInput = $state('');
  let showChat = $state(false);

  // Reactions
  let activeReactions = $state<FloatingReaction[]>([]);
  let reactionIdCounter = 0;

  // ─── Connection Health ──────────────────────────────────────────────
  let connectionHealth = $state<'good' | 'degraded' | 'poor'>('good');
  let healthMonitorInterval: ReturnType<typeof setInterval> | null = null;
  let lastSentBytes = 0;
  let lastSentTime = 0;
  let targetBitrate = 2_500_000;
  let lastHealthState: 'good' | 'degraded' | 'poor' = 'good';

  /** Poll outbound-rtp stats from the send transport and derive health. */
  function startHealthMonitor(bitrate: number) {
    stopHealthMonitor();
    targetBitrate = bitrate;
    lastSentBytes = 0;
    lastSentTime = 0;
    connectionHealth = 'good';
    lastHealthState = 'good';
    healthMonitorInterval = setInterval(checkHealth, 5000);
  }

  function stopHealthMonitor() {
    if (healthMonitorInterval) {
      clearInterval(healthMonitorInterval);
      healthMonitorInterval = null;
    }
  }

  async function checkHealth() {
    if (!sfuClient || !isSharing) return;
    try {
      const stats = await sfuClient.getStats();
      if (!stats) return;

      let outboundBitrate = 0;
      let packetsLost = 0;
      let packetsSent = 0;

      for (const report of stats as any[]) {
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          const now = Date.now();
          const bytesSent = report.bytesSent || 0;
          if (lastSentTime > 0) {
            const elapsed = (now - lastSentTime) / 1000;
            const delta = bytesSent - lastSentBytes;
            outboundBitrate = (delta * 8) / elapsed;
          }
          lastSentBytes = bytesSent;
          lastSentTime = now;
        }
        if (report.type === 'remote-inbound-rtp') {
          packetsLost = report.packetsLost || 0;
          packetsSent = report.packetsSent || 1;
        }
      }

      const lossRate = packetsSent > 0 ? packetsLost / packetsSent : 0;
      const bitrateRatio = targetBitrate > 0 ? outboundBitrate / targetBitrate : 1;

      let newState: 'good' | 'degraded' | 'poor';
      if (lossRate > 0.05 || bitrateRatio < 0.25) newState = 'poor';
      else if (lossRate > 0.02 || bitrateRatio < 0.50) newState = 'degraded';
      else newState = 'good';

      connectionHealth = newState;

      // Auto-adapt: notify on health degradation (only if toggle is on and state changed).
      if (autoAdaptQuality && newState !== lastHealthState && newState !== 'good') {
        const label = newState === 'poor' ? 'inestable' : 'degradada';
        const advice = qualityPreset !== 'low' ? ' Considera bajar la calidad.' : '';
        showAutoAdaptNotification(`Conexión ${label}.${advice}`);
      }
      lastHealthState = newState;
    } catch {}
  }

  // ─── Page Visibility ────────────────────────────────────────────────
  let tabHidden = $state(false);

  function handleVisibilityChange() {
    tabHidden = document.hidden;
  }

  // ─── Lifecycle Cleanup ──────────────────────────────────────────────
  let copyFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;
  let loadingTimeout: ReturnType<typeof setTimeout> | null = null;
  let cleanedUp = false;
  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    if (celebrationTimeout) clearTimeout(celebrationTimeout);
    if (autoAdaptNotificationTimeout) clearTimeout(autoAdaptNotificationTimeout);
    if (copyFeedbackTimeout) clearTimeout(copyFeedbackTimeout);
    if (loadingTimeout) clearTimeout(loadingTimeout);
    stopHealthMonitor();
    stopSharing();
    if (sfuClient) {
      sfuClient.disconnect();
      sfuClient = null;
    }
    if (socket) {
      socket.emit('host:close-room', { roomId });
      socket.disconnect();
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', cleanup);
    }
  }

  onDestroy(cleanup);

  function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

  // ─── Emote Picker ──────────────────────────────────────────────────
  let showEmotePicker = $state(false);
  const HOST_FAVORITES_KEY = 'wachaut.host.favorites';
  let favoriteEmojis = $state<string[]>(loadFavorites(HOST_FAVORITES_KEY));

  // ─── Notifications ─────────────────────────────────────────────────
  let notificationsMuted = $state(isNotifMuted());
  function toggleNotificationsMuted() {
    notificationsMuted = !notificationsMuted;
    setNotifMuted(notificationsMuted);
  }

  // First viewer celebration
  let celebrationTimeout: ReturnType<typeof setTimeout> | null = null;
  let showFirstViewerCelebration = $state(false);
  let confettiParticles = $state<ConfettiParticle[]>([]);

  // Recording
  let isRecording = $state(false);
  let mediaRecorder: MediaRecorder | null = $state(null);
  let recordedChunks: Blob[] = [];
  let recordingDuration = $state(0);
  let recordingInterval: ReturnType<typeof setInterval> | null = null;

  // Quality Settings
  let qualityPreset = $state('normal');
  let showSettings = $state(false);
  const presets = $state<Record<string, QualityPreset>>({
    low: { label: 'Liviano', resolution: { width: 1280, height: 720 }, fps: 15, bitrate: 1_000_000, desc: 'Ideal para conexiones lentas' },
    normal: { label: 'Normal', resolution: { width: 1920, height: 1080 }, fps: 30, bitrate: 2_500_000, desc: 'Uso general' },
    high: { label: 'Alta calidad', resolution: { width: 1920, height: 1080 }, fps: 60, bitrate: 5_000_000, desc: 'Gaming y diseño' }
  });

  // Safe label lookup that handles the 'custom' preset (not in the presets map).
  function presetLabel(key: string): string {
    return key === 'custom' ? 'Personalizado' : presets[key]?.label ?? '—';
  }

  // Audio toggle for screen share
  let includeAudio = $state(true);
  // 'detail' = sharp text/UI (default), 'motion' = smooth video/gaming
  let contentHintMode = $state<'detail' | 'motion'>('detail');

  // Auto quality adaptation
  let autoAdaptQuality = $state(true);
  // Custom quality sliders (used when qualityPreset === 'custom')
  let customRes = $state(1080);
  let customFps = $state(30);
  let customBitrate = $state(2_500_000);
  let autoAdaptNotification = $state('');
  let autoAdaptNotificationTimeout: ReturnType<typeof setTimeout> | null = null;
  // Viewer list for kick
  let viewersList = $state<Viewer[]>([]);
  let showViewersPanel = $state(false);

  // Room info
  let roomId = $state(crypto.randomUUID());
  function generatePin(): string {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }
  const pin = generatePin();
  // Embed the PIN in the URL hash so viewers don't need to type it.
  // The hash (#) is never sent to the server, preserving the PIN's security.
  const roomUrl = $derived(`${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}#${pin}`);

  // Attach stream to video element when both are available
  $effect(() => {
    const stream = localStream;
    if (videoPreview && stream) {
      videoPreview.srcObject = stream;
      videoPreview.play().catch(() => {});
    }
  });

  // ─── Reactions ───────────────────────────────────────────────────────
  function addReaction(emoji: string) {
    const id = ++reactionIdCounter;
    const idx = reactionIdCounter % 4;
    const scales = [1.6, 2.0, 2.5, 1.8];
    const bottoms = [40, 120, 200, 80];
    const xOffsets = ['0px', '-20px', '15px', '-10px'];
    const rotations = ['-12deg', '8deg', '-5deg', '15deg'];
    const newReaction: FloatingReaction = {
      id, emoji,
      x: Math.random() * 70 + 10,
      bottom: bottoms[idx],
      fontSize: scales[idx],
      xOffset: xOffsets[idx],
      rotation: rotations[idx],
      delay: Math.random() * 0.2,
      duration: 2.5 + Math.random() * 1,
      createdAt: Date.now()
    };
    activeReactions = [...activeReactions, newReaction];
    setTimeout(() => {
      activeReactions = activeReactions.filter(r => r.id !== id);
    }, (newReaction.duration + newReaction.delay) * 1000 + 200);
  }

  function handleSendReaction(emoji: string) {
    if (!socket || !connected) return;
    if (ALL_EMOTES.includes(emoji)) {
      favoriteEmojis = trackFavorite(HOST_FAVORITES_KEY, favoriteEmojis, emoji);
    }
    showEmotePicker = false;
    addReaction(emoji);
    socket.emit('reaction:send', { emoji, roomId });
  }

  // ─── Recording ──────────────────────────────────────────────────────
  function startRecording() {
    if (!localStream) return;
    recordedChunks = [];
    const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(options.mimeType as string)) {
      options.mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(options.mimeType as string)) {
      options.mimeType = 'video/webm';
    }
    mediaRecorder = new MediaRecorder(localStream, options);
    mediaRecorder.ondataavailable = (e: BlobEvent) => {
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
    if (recordingInterval) clearInterval(recordingInterval);
    recordingInterval = null;
  }

  // ─── Chat Commands ───────────────────────────────────────────────────
  function processChatCommand(text: string): boolean {
    const parts = text.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case '/help': {
        addSystemMessage('Comandos disponibles: /help, /stats, /clear, /kick <username>');
        return true;
      }
      case '/stats': {
        const stats = {
          viewers: viewerCount,
          connected: connected ? 'Sí' : 'No',
          sharing: isSharing ? 'Sí' : 'No',
          muted: isMuted ? 'Sí' : 'No',
          sfu: sfuClient ? 'Conectado' : 'Desconectado',
          quality: presetLabel(qualityPreset)
        };
        addSystemMessage(`Estadísticas: Espectadores=${stats.viewers}, Conectado=${stats.connected}, Compartiendo=${stats.sharing}, Silenciado=${stats.muted}, SFU=${stats.sfu}, Calidad=${stats.quality}`);
        return true;
      }
      case '/clear': {
        chatMessages = [];
        addSystemMessage('Chat limpiado.');
        return true;
      }
      case '/kick': {
        if (!args[0]) {
          addSystemMessage('Uso: /kick <username>');
          return true;
        }
        const viewerId = args[0];
        if (!socket) return true;
        socket.emit('host:kick', { roomId, viewerId });
        addSystemMessage(`Solicitud de expulsión enviada para ${viewerId}`);
        return true;
      }
      default:
        return false;
    }
  }

  function addSystemMessage(text: string) {
    chatMessages = [...chatMessages, systemMessage(text)];
  }

  function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || !socket || !connected || text.length > 500) return;

    if (text.startsWith('/')) {
      const handled = processChatCommand(text);
      if (handled) {
        chatInput = '';
        return;
      }
    }

    socket.emit('chat:message', { roomId, text, sender: SENDER_HOST });
    chatInput = '';
  }

  // ─── Socket.IO ───────────────────────────────────────────────────────
  function initSocket() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api-wachaut.billytech.es';
    socket = io(wsUrl, { transports: ['websocket'] });

    // Safety net: if the server never confirms room creation, surface an error
    // instead of hanging on the loading overlay forever.
    loadingTimeout = setTimeout(() => {
      if (loading) {
        loading = false;
        error = 'No se pudo crear la sala. Inténtalo de nuevo.';
        setTimeout(() => { error = ''; }, 5000);
      }
    }, 10000);

    socket.on('connect_error', () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      error = 'No se pudo conectar al servidor. Verifica tu conexión.';
      loading = false;
      setTimeout(() => { error = ''; }, 5000);
    });

    socket.on('connect', () => {
      const wasConnected = connected;
      connected = true;

      if (wasConnected) {
        // Reconnection after a drop — reclaim the room and notify the user.
        toast.success('Conexión restablecida');
      }

      socket.emit('host:create-room', { roomId, pin });
      socket.once('room:created', (data: any) => {
        if (loadingTimeout) { clearTimeout(loadingTimeout); loadingTimeout = null; }
        if (data?.roomId) {
          roomId = data.roomId;
          // Only create a new SFU client on first connect (not on reconnect).
          if (!sfuClient) {
            const sfuUrl = import.meta.env.VITE_SFU_URL || 'wss://sfu-wachaut.billytech.es';
            sfuClient = new SfuClient(sfuUrl);
            sfuClient.on('error', (msg: string) => console.error('[sfu]', msg));
            sfuClient.on('peer-joined', (d: any) => console.log('[sfu] peer-joined:', d));
            sfuClient.on('peer-left', (d: any) => console.log('[sfu] peer-left:', d));
            sfuClient.joinRoom(roomId, pin, SENDER_HOST, 'host')
              .then(() => console.log('[sfu] joined room'))
              .catch((err: unknown) => console.error('[sfu] join failed:', err));
          }
        }
        loading = false; // Room is ready — no artificial delay
      });
    });

    socket.on('disconnect', () => {
      connected = false;
      // Notify the host that they've lost connection (Socket.IO auto-reconnects).
      if (isSharing) toast.warning('Conexión perdida. Reintentando…');
    });

    socket.on('error', (err: any) => {
      error = typeof err === 'string' ? err : err?.message || 'Error de conexión';
      setTimeout(() => { error = ''; }, 5000);
    });

    // Viewers
    socket.on('viewer:joined', (data: any) => {
      const wasEmpty = viewerCount === 0;
      viewerCount = viewerCount + 1;
      if (data.username) addSystemMessage(`${data.username} se unio a la sala.`);
      try { playViewerJoin(); } catch {}
      if (wasEmpty) triggerFirstViewerCelebration();
    });

    socket.on('viewer:left', (data: any) => {
      viewerCount = Math.max(0, viewerCount - 1);
      if (data.username) addSystemMessage(`${data.username} salio de la sala.`);
      try { playViewerLeave(); } catch {}
    });

    // Chat
    socket.on('chat:history', (data: any) => {
      if (data?.messages) {
        chatMessages = data.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp || Date.now())
        }));
      }
    });

    socket.on('chat:message', (msg: any) => {
      chatMessages = [...chatMessages, {
        ...msg,
        timestamp: new Date(msg.timestamp || Date.now())
      }];
      try { playChatMessage(); } catch {}
    });

    // Reactions from viewers
    socket.on('reaction:receive', (data: any) => addReaction(data.emoji));

    // Viewers list
    socket.on('host:viewers-list', (data: any) => {
      if (data?.viewers) viewersList = data.viewers;
    });

    socket.on('host:kick-failed', (data: any) => {
      addSystemMessage(data?.message || 'No se pudo expulsar al espectador.');
    });
  }

  // ─── Screen Sharing ─────────────────────────────────────────────────
  async function startSharing() {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
    try {
      // Build capture constraints from preset or custom settings.
      let captureWidth: number, captureHeight: number, captureFps: number, captureBitrate: number;
      if (qualityPreset === 'custom') {
        captureHeight = customRes;
        captureWidth = Math.round(customRes * 16 / 9); // assume 16:9
        captureFps = customFps;
        captureBitrate = customBitrate;
      } else {
        const preset = presets[qualityPreset];
        captureWidth = preset.resolution.width;
        captureHeight = preset.resolution.height;
        captureFps = preset.fps;
        captureBitrate = preset.bitrate;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: captureWidth },
          height: { ideal: captureHeight },
          frameRate: { ideal: captureFps },
        },
        audio: includeAudio,
      });
      localStream = stream;
      isSharing = true;
      connectionHealth = 'good';

      // Tell the encoder this is screen content (text/UI/code), not a webcam.
      // 'detail' prioritizes sharpness over smoothness and disables denoising.
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) vTrack.contentHint = contentHintMode;

      if (sfuClient) {
        await sfuClient.produce(stream, { maxBitrate: captureBitrate });
      }

      startHealthMonitor(captureBitrate);
      stream.getVideoTracks()[0].onended = () => stopSharing();
    } catch (e: any) {
      // Clean up any stream we may have started to avoid a dangling capture indicator.
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
      }
      isSharing = false;
      isMuted = false;
      if (e?.name === 'NotAllowedError') {
        toast.error('Permiso denegado para compartir pantalla.');
      } else {
        toast.error('No se pudo iniciar la compartición de pantalla.');
      }
    }
  }

  function stopSharing() {
    if (isRecording) stopRecording();
    stopHealthMonitor();
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
    isSharing = false;
    isMuted = false;
    if (sfuClient) sfuClient.stopProducing();
    if (socket && connected) socket.emit('host:stop-sharing', { roomId });
  }

  function toggleMute() {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;
    const newMuted = !isMuted;
    audioTracks.forEach(t => { t.enabled = !newMuted; });
    isMuted = newMuted;
    if (socket && connected) {
      socket.emit(newMuted ? 'host:mute' : 'host:unmute', { roomId });
    }
  }

  // ─── Quality Adaptation ────────────────────────────────────────────
  function showAutoAdaptNotification(text: string) {
    autoAdaptNotification = text;
    if (autoAdaptNotificationTimeout) clearTimeout(autoAdaptNotificationTimeout);
    autoAdaptNotificationTimeout = setTimeout(() => { autoAdaptNotification = ''; }, 4000);
  }

  // React to manual preset changes — only notify on actual changes while sharing.
  let lastNotifiedPreset = qualityPreset;
  $effect(() => {
    if (qualityPreset !== lastNotifiedPreset && isSharing) {
      showAutoAdaptNotification(`Calidad cambiada a ${presetLabel(qualityPreset)}. Aplicará al reiniciar la compartición.`);
    }
    lastNotifiedPreset = qualityPreset;
  });

  function toggleFullscreen() {
    if (!videoContainer) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      isFullscreen = false;
    } else {
      videoContainer.requestFullscreen();
      isFullscreen = true;
    }
  }

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────
  function handleHostKeydown(e: KeyboardEvent) {
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

    // Escape always works — close any open modal/picker
    if (e.key === 'Escape') {
      if (showEmotePicker) { showEmotePicker = false; return; }
      if (showSettings) { showSettings = false; return; }
      if (showViewersPanel) { showViewersPanel = false; return; }
      if (showLeaveModal) { showLeaveModal = false; return; }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        isFullscreen = false;
      }
      return;
    }

    // Don't process single-key shortcuts when typing in inputs
    if (isInput) return;

    switch (e.key.toLowerCase()) {
      case 'm':
        if (isSharing) { e.preventDefault(); toggleMute(); }
        break;
      case 'f':
        if (isSharing) { e.preventDefault(); toggleFullscreen(); }
        break;
    }
  }

  function requestViewersList() {
    if (socket && connected) socket.emit('host:request-viewers', { roomId });
  }

  function kickViewer(viewerId: string) {
    if (!socket || !connected) return;
    socket.emit('host:kick', { roomId, viewerId });
    addSystemMessage(`Solicitud de expulsión enviada para ${viewerId}`);
  }

  // ─── Clipboard ──────────────────────────────────────────────────────
  async function copyInvite() {
    const ok = await copyText(roomUrl);
    if (ok) {
      copiedInvite = true;
      if (copyFeedbackTimeout) clearTimeout(copyFeedbackTimeout);
      copyFeedbackTimeout = setTimeout(() => { copiedInvite = false; }, 2000);
      toast.success('¡Invitación copiada!');
    } else {
      toast.error('No se pudo copiar al portapapeles');
    }
  }

  // ─── Navigation ─────────────────────────────────────────────────────
  function leaveRoom() {
    stopSharing();
    if (socket) socket.disconnect();
    goto('/');
  }

  // ─── First Viewer Celebration ────────────────────────────────────────
  function triggerFirstViewerCelebration() {
    showFirstViewerCelebration = true;
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
    const emojis = ['🎉', '🎊', '✨', '🥳', '👋', '🙌'];
    const particles: ConfettiParticle[] = [];
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
    celebrationTimeout = setTimeout(() => {
      showFirstViewerCelebration = false;
      confettiParticles = [];
    }, 3500);
  }

  // Track how many non-system messages existed when the chat was last open,
  // so the badge shows truly unread messages rather than the full history.
  let seenCount = $state(0);
  let unreadCount = $derived.by(() => {
    const nonSystem = chatMessages.filter((m) => m.sender !== 'Sistema').length;
    return showChat ? 0 : Math.max(0, nonSystem - seenCount);
  });

  // ─── Init ───────────────────────────────────────────────────────────
  // Detect if screen sharing is supported (mobile browsers typically can't host).
  canScreenShare = typeof navigator !== 'undefined'
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getDisplayMedia === 'function';

  if (canScreenShare) {
    initSocket();
  } else {
    loading = false;
  }
</script>

<svelte:window onkeydown={handleHostKeydown} />

<!-- Mobile / unsupported gate -->
{#if !canScreenShare}
  <div class="flex min-h-screen flex-col items-center justify-center bg-app px-6 text-center">
    <div class="relative mb-6">
      <div class="absolute inset-0 rounded-full opacity-40 blur-2xl bg-[var(--danger)]"></div>
      <div class="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)]">
        <Monitor class="h-10 w-10 text-[var(--text-subtle)]" />
      </div>
    </div>
    <h1 class="mb-3 text-2xl font-bold text-[var(--text)]" style="font-family: var(--font-display);">
      Compartir pantalla no disponible
    </h1>
    <p class="mb-2 max-w-sm text-sm text-[var(--text-muted)]">
      Tu navegador o dispositivo no soporta la compartición de pantalla.
    </p>
    <p class="mb-8 max-w-sm text-sm text-[var(--text-subtle)]">
      Abre Wachaut en un ordenador con Chrome, Firefox, Edge o Safari para compartir tu pantalla.
    </p>
    <a href="/" class="btn-secondary gap-2">
      <ArrowLeft class="h-4 w-4" />
      Volver al inicio
    </a>
  </div>
{:else if loading}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink-950)]/95 backdrop-blur-sm">
    <div class="text-center">
      <div class="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
        <Spinner size="lg" />
        <Eye class="absolute h-7 w-7 text-[var(--text-muted)]" />
      </div>
      <h2 class="mb-2 text-xl font-semibold text-[var(--text)]">Preparando sala…</h2>
      <p class="text-sm text-[var(--text-muted)]">Creando sala segura para tu transmisión</p>
    </div>
  </div>
{:else}
<!-- Auto Quality Adaptation Notification -->
{#if autoAdaptNotification}
  <div
    class="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-2 shadow-lg glass animate-fade-in"
    style="border: 1px solid color-mix(in srgb, var(--brand) 30%, transparent);"
    role="status"
    aria-live="polite"
  >
    <SettingsIcon class="h-4 w-4 text-[var(--brand)]" />
    <span class="text-sm font-medium text-[var(--text)]">{autoAdaptNotification}</span>
  </div>
{/if}

<!-- Floating reactions + celebration -->
<ReactionLayer reactions={activeReactions} celebrate={showFirstViewerCelebration} confetti={confettiParticles} />

<!-- Viewers panel modal -->
<ViewersPanel
  open={showViewersPanel}
  viewers={viewersList}
  count={viewerCount}
  onKick={kickViewer}
  onClose={() => (showViewersPanel = false)}
/>

<!-- Leave confirmation modal -->
<Modal open={showLeaveModal} title="¿Salir de la sala?" label="Confirmar salida" size="sm" onClose={() => (showLeaveModal = false)}>
  <div class="mb-5 flex items-center gap-3">
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--danger)]/12">
      <AlertTriangle class="h-5 w-5 text-[var(--danger)]" />
    </span>
    <p class="text-sm text-[var(--text-muted)]">
      Se cerrará la conexión con todos los espectadores y la sala será eliminada permanentemente.
    </p>
  </div>
  <div class="flex gap-3">
    <button
      onclick={() => (showLeaveModal = false)}
      class="btn-secondary flex-1"
    >
      Cancelar
    </button>
    <button
      onclick={leaveRoom}
      class="btn-danger flex-1"
    >
      Salir
    </button>
  </div>
</Modal>

<!-- Main Container -->
<div class="flex h-screen flex-col bg-app">
  <HostHeader
    sharing={isSharing}
    health={connectionHealth}
    viewerCount={viewerCount}
    notificationsMuted={notificationsMuted}
    chatOpen={showChat}
    unreadCount={unreadCount}
    onBack={() => (showLeaveModal = true)}
    onToggleNotifications={toggleNotificationsMuted}
    onToggleChat={() => {
      showChat = !showChat;
      if (showChat) seenCount = chatMessages.filter((m) => m.sender !== 'Sistema').length;
    }}
    onOpenViewers={() => { showViewersPanel = true; requestViewersList(); }}
  />

  <!-- Main Content -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Video Area -->
    <div class="relative flex-1">
      <VideoStage
        sharing={isSharing}
        muted={isMuted}
        fullscreen={isFullscreen}
        recording={isRecording}
        recordingDuration={recordingDuration}
        onVideoMount={(el) => (videoPreview = el)}
        onContainerMount={(el) => (videoContainer = el)}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onStopSharing={stopSharing}
      />
    </div>

    <!-- Sidebar: single instance, responsive (desktop static / mobile drawer) -->
    <!-- Mobile backdrop -->
    {#if showChat}
      <button
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        onclick={() => (showChat = false)}
        aria-label="Cerrar panel"
        tabindex="-1"
      ></button>
    {/if}

    <!-- Sidebar wrapper: static on md+, fixed drawer on mobile -->
    <div
      class="h-full min-h-0 md:block {showChat
        ? 'max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-80 max-md:max-w-[85vw] max-md:transition-transform max-md:duration-300'
        : 'max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-80 max-md:max-w-[85vw] max-md:translate-x-full max-md:transition-transform max-md:duration-300'}"
    >
      <RoomSidebar
        {pin}
        roomUrl={roomUrl}
        {copiedInvite}
        sharing={isSharing}
        presets={presets}
        bind:qualityPreset
        {showSettings}
        bind:includeAudio
        bind:autoAdapt={autoAdaptQuality}
        bind:contentHint={contentHintMode}
        bind:customRes
        bind:customFps
        bind:customBitrate
        recording={isRecording}
        recordingDuration={recordingDuration}
        {favoriteEmojis}
        {showEmotePicker}
        onCopyInvite={copyInvite}
        onToggleSettings={() => (showSettings = !showSettings)}
        onShare={() => { startSharing(); showChat = false; }}
        onStop={stopSharing}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSendReaction={handleSendReaction}
        onToggleEmotePicker={() => (showEmotePicker = !showEmotePicker)}
        onCloseEmotePicker={() => (showEmotePicker = false)}
        onLeave={() => (showLeaveModal = true)}
      >
        <ChatPanel messages={chatMessages} bind:value={chatInput} onSend={sendChatMessage} />
      </RoomSidebar>
    </div>
  </div>
</div>
{/if}
