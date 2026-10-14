<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    logout, getMetrics, getRooms, getStats, getSecurity, setMaintenance,
    closeRoom, kickViewer, getAudit,
    type AdminMetrics, type AdminRoom, type AdminStats, type AdminSecurity, type AuditPage,
  } from '$lib/admin';
  import { adminSession } from '$lib/admin-session.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Pill from '$lib/components/Pill.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import {
    Activity, Users, Server, Globe, Lock, Wrench, RefreshCw, X, ChevronLeft, ChevronRight,
    VolumeX, MessageSquare, WifiOff, ScanSearch,
  } from 'lucide-svelte';

  const isSuperadmin = $derived(adminSession.user?.role === 'superadmin');

  let metrics = $state<AdminMetrics | null>(null);
  let rooms = $state<AdminRoom[]>([]);
  let stats = $state<AdminStats | null>(null);
  let security = $state<AdminSecurity | null>(null);
  let loading = $state(true);
  let loadError = $state('');
  let connectionLost = $state(false);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  // Generic confirmation modal (close room / kick viewer / maintenance).
  let confirmState = $state<{ title: string; message: string; danger?: boolean; action: () => Promise<void> } | null>(null);
  let confirmBusy = $state(false);

  // Full audit modal.
  let auditOpen = $state(false);
  let audit = $state<AuditPage | null>(null);
  let auditOffset = $state(0);
  let auditFilter = $state('');
  let auditLoading = $state(false);
  const AUDIT_PAGE_SIZE = 25;

  onMount(() => {
    if (!adminSession.token) { goto('/admin'); return; }
    void loadAll();
    pollTimer = setInterval(() => {
      if (document.hidden) return; // pause polling on background tabs
      void loadLive();
    }, 5000);
  });

  onDestroy(() => { if (pollTimer) clearInterval(pollTimer); });

  async function loadAll() {
    loading = true;
    loadError = '';
    try {
      await Promise.all([loadLive(), loadStats(), loadSecurity()]);
    } catch (err: any) {
      if (err.message === 'Session expired') {
        toast.info('Tu sesión ha expirado');
        goto('/admin');
      } else {
        loadError = err?.message || 'No se pudo cargar el panel';
      }
    } finally {
      loading = false;
    }
  }

  async function loadLive() {
    try {
      const [m, r] = await Promise.all([getMetrics(), getRooms()]);
      metrics = m;
      rooms = r.rooms;
      connectionLost = false;
    } catch (err: any) {
      if (err.message === 'Session expired') {
        toast.info('Tu sesión ha expirado');
        goto('/admin');
      } else {
        connectionLost = true; // stale data keeps rendering + banner
      }
    }
  }

  async function loadStats() {
    stats = await getStats();
  }

  async function loadSecurity() {
    security = await getSecurity();
  }

  function askMaintenance() {
    if (!metrics) return;
    const enabling = !metrics.maintenance;
    confirmState = {
      title: enabling ? 'Activar modo mantenimiento' : 'Desactivar modo mantenimiento',
      message: enabling
        ? 'El servidor dejará de aceptar tráfico nuevo (el load balancer lo saca de rotación). Las salas activas se mantienen. Se restablece al reiniciar el proceso.'
        : 'El servidor volverá a aceptar tráfico inmediatamente.',
      danger: enabling,
      action: async () => {
        const res = await setMaintenance(enabling);
        if (metrics) metrics.maintenance = res.maintenance;
        toast.success(res.maintenance ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado');
      },
    };
  }

  function askCloseRoom(room: AdminRoom) {
    confirmState = {
      title: 'Cerrar sala',
      message: `Se expulsará a los ${room.viewerCount} espectadores de la sala ${room.id.slice(0, 8)}… y se informará al anfitrión.`,
      danger: true,
      action: async () => {
        await closeRoom(room.id);
        toast.success('Sala cerrada');
        await loadLive();
      },
    };
  }

  function askKick(roomId: string, viewerName: string) {
    confirmState = {
      title: 'Expulsar espectador',
      message: `Se expulsará a "${viewerName}" de la sala ${roomId.slice(0, 8)}….`,
      danger: true,
      action: async () => {
        await kickViewer(roomId, viewerName);
        toast.success(`"${viewerName}" expulsado`);
        await loadLive();
      },
    };
  }

  async function runConfirm() {
    if (!confirmState) return;
    confirmBusy = true;
    try {
      await confirmState.action();
      confirmState = null;
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      confirmBusy = false;
    }
  }

  async function openAudit(reset = true) {
    auditOpen = true;
    if (reset) { auditOffset = 0; auditFilter = ''; }
    await loadAuditPage();
  }

  async function loadAuditPage() {
    auditLoading = true;
    try {
      audit = await getAudit(AUDIT_PAGE_SIZE, auditOffset, auditFilter || undefined);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar la auditoría');
    } finally {
      auditLoading = false;
    }
  }

  async function handleLogout() {
    await logout();
    goto('/admin');
  }

  function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
  }

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  function formatDay(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  let maxCountryCount = $derived(stats ? Math.max(...stats.countries.map(c => c.count), 1) : 1);
  let maxDayViewers = $derived(stats ? Math.max(...stats.traffic.map(d => d.total_viewers), 1) : 1);
</script>

{#if connectionLost}
  <div class="mb-4 flex items-center gap-2 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-2.5 text-sm text-[var(--warning)]" role="status">
    <WifiOff size={16} aria-hidden="true" />
    Conexión perdida con el servidor — reintentando…
  </div>
{/if}

{#if loading && !metrics}
  <div class="flex h-64 items-center justify-center gap-2 text-[var(--text-muted)]">
    <Spinner size="md" />
    Cargando panel…
  </div>
{:else if loadError && !metrics}
  <Card class="flex flex-col items-center gap-4 p-10 text-center">
    <p class="text-sm text-[var(--danger)]">{loadError}</p>
    <Button variant="secondary" onclick={() => void loadAll()}>
      <RefreshCw size={16} aria-hidden="true" />
      Reintentar
    </Button>
  </Card>
{:else if metrics}
  <!-- Metric cards -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <Card class="p-4">
      <div class="flex items-center gap-2 text-[var(--text-muted)]">
        <Users size={16} aria-hidden="true" />
        <span class="text-xs font-medium">Salas activas</span>
      </div>
      <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{metrics.rooms}</p>
    </Card>
    <Card class="p-4">
      <div class="flex items-center gap-2 text-[var(--text-muted)]">
        <Activity size={16} aria-hidden="true" />
        <span class="text-xs font-medium">Viewers</span>
      </div>
      <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{metrics.viewers}</p>
    </Card>
    <Card class="p-4">
      <div class="flex items-center gap-2 text-[var(--text-muted)]">
        <Server size={16} aria-hidden="true" />
        <span class="text-xs font-medium">Conexiones</span>
      </div>
      <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{metrics.connections}</p>
    </Card>
    <Card class="p-4">
      <div class="flex items-center gap-2 text-[var(--text-muted)]">
        <Globe size={16} aria-hidden="true" />
        <span class="text-xs font-medium">SFU</span>
      </div>
      <p class="mt-2 text-2xl font-bold text-[var(--brand)]">
        {metrics.sfu?.rooms ?? '?'}
        <span class="ml-1 text-xs font-normal text-[var(--text-muted)]">salas / {metrics.sfu?.totalPeers ?? '?'} peers</span>
      </p>
    </Card>
  </div>

  <!-- System status + maintenance -->
  <div class="mt-4 flex flex-wrap items-center gap-3">
    {#if metrics.sfu}
      <Pill tone="success" pulse>SFU: {metrics.sfu.status} · {metrics.sfu.workers} workers</Pill>
    {:else}
      <Pill tone="danger">SFU: inalcanzable</Pill>
    {/if}
    <Pill tone={metrics.maintenance ? 'danger' : 'neutral'}>Uptime: {formatUptime(metrics.uptime)}</Pill>
    <Pill tone="neutral">RAM: {metrics.memory}MB</Pill>
    {#if isSuperadmin}
      <div class="ml-auto">
        <Button variant={metrics.maintenance ? 'secondary' : 'danger'} size="sm" onclick={askMaintenance}>
          <Wrench size={14} aria-hidden="true" />
          {metrics.maintenance ? 'Desactivar mantenimiento' : 'Modo mantenimiento'}
        </Button>
      </div>
    {/if}
  </div>

  <!-- Two column layout: rooms + traffic -->
  <div class="mt-6 grid gap-4 lg:grid-cols-2">
    <!-- Active rooms with moderation -->
    <Card class="p-4">
      <h2 class="mb-3 text-sm font-bold text-[var(--text)]">Salas activas ({rooms.length})</h2>
      {#if rooms.length === 0}
        <p class="py-8 text-center text-sm text-[var(--text-muted)]">No hay salas activas</p>
      {:else}
        <div class="max-h-96 space-y-2 overflow-y-auto pr-1">
          {#each rooms as room (room.id)}
            <div class="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex min-w-0 flex-wrap items-center gap-2">
                  <code class="text-xs text-[var(--text-muted)]" title={room.id}>{room.id.slice(0, 8)}…</code>
                  {#if room.isSharing}
                    <Pill tone="success">compartiendo</Pill>
                  {:else}
                    <Pill tone="neutral">inactivo</Pill>
                  {/if}
                  {#if room.isMuted}
                    <Badge tone="warning"><VolumeX size={12} class="mr-1" aria-hidden="true" />muteado</Badge>
                  {/if}
                  <span class="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Users size={12} aria-hidden="true" />{room.viewerCount}
                  </span>
                  <span class="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]" title="Mensajes de chat">
                    <MessageSquare size={12} aria-hidden="true" />{room.chatMessages}
                  </span>
                </div>
                <Button variant="danger" size="sm" onclick={() => askCloseRoom(room)}>Cerrar</Button>
              </div>
              {#if room.viewers.length > 0}
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each room.viewers as v (v.name)}
                    <span class="group inline-flex items-center gap-1 rounded bg-[var(--surface-2)] pr-1 text-[0.65rem] text-[var(--text-muted)]">
                      {v.name}
                      <button
                        onclick={() => askKick(room.id, v.name)}
                        class="rounded p-0.5 hover:bg-[var(--danger)]/20 hover:text-[var(--danger)]"
                        aria-label="Expulsar a {v.name}"
                        title="Expulsar a {v.name}"
                      >
                        <X size={10} aria-hidden="true" />
                      </button>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <!-- Traffic 7 days + countries -->
    <div class="space-y-4">
      <Card class="p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-bold text-[var(--text)]">Tráfico últimos 7 días</h2>
          <Button variant="ghost" size="sm" onclick={() => void loadStats().catch((e) => toast.error(e.message))} aria-label="Refrescar estadísticas">
            <RefreshCw size={14} aria-hidden="true" />
          </Button>
        </div>
        {#if !stats || stats.traffic.length === 0}
          <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin datos aún</p>
        {:else}
          <div class="space-y-2">
            {#each [...stats.traffic].reverse() as day (day.date)}
              <div class="flex items-center gap-2" title="Pico: {day.peak_viewers} · Salas: {day.total_rooms}">
                <span class="w-14 text-xs text-[var(--text-muted)]">{formatDay(day.date)}</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]"
                    style="width: {(day.total_viewers / maxDayViewers) * 100}%"
                  ></div>
                </div>
                <span class="w-16 text-right text-xs text-[var(--text-muted)]">{day.total_viewers} viewers</span>
              </div>
            {/each}
          </div>
        {/if}
      </Card>

      <Card class="p-4">
        <h2 class="mb-3 text-sm font-bold text-[var(--text)]">Tráfico por país (histórico)</h2>
        {#if !stats || stats.countries.length === 0}
          <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin datos aún</p>
        {:else}
          <div class="space-y-2">
            {#each stats.countries as c (c.country)}
              <div class="flex items-center gap-2">
                <span class="w-10 text-xs font-bold text-[var(--brand)]">{c.country}</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]"
                    style="width: {(c.count / maxCountryCount) * 100}%"
                  ></div>
                </div>
                <span class="w-8 text-right text-xs text-[var(--text-muted)]">{c.count}</span>
              </div>
            {/each}
          </div>
        {/if}
      </Card>

      <Card class="flex items-center justify-between p-4">
        <h2 class="text-sm font-bold text-[var(--text)]">Total salas creadas</h2>
        <span class="text-2xl font-bold text-[var(--brand)]">{stats?.totalRoomsCreated ?? '—'}</span>
      </Card>
    </div>
  </div>

  <!-- Security panel -->
  {#if security}
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <Card class="p-4">
        <h2 class="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <Lock size={16} aria-hidden="true" /> IPs conectadas
        </h2>
        {#if security.ips.length === 0}
          <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin conexiones</p>
        {:else}
          <div class="max-h-48 space-y-1 overflow-y-auto">
            {#each security.ips as ip (ip.ip)}
              <div class="flex items-center justify-between py-1 text-xs">
                <code class="text-[var(--text-muted)]">{ip.ip}</code>
                <span class="flex items-center gap-2">
                  <span class="text-[var(--brand)]">{ip.country}</span>
                  <span class="text-[var(--text-muted)]">{ip.connections}</span>
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </Card>

      <Card class="p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-bold text-[var(--text)]">Auditoría reciente</h2>
          <div class="flex items-center gap-1">
            <Button variant="ghost" size="sm" onclick={() => void loadSecurity().catch((e) => toast.error(e.message))} aria-label="Refrescar seguridad">
              <RefreshCw size={14} aria-hidden="true" />
            </Button>
            <Button variant="secondary" size="sm" onclick={() => void openAudit()}>
              <ScanSearch size={14} aria-hidden="true" />
              Ver todo
            </Button>
          </div>
        </div>
        {#if security.auditLog.length === 0}
          <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin eventos</p>
        {:else}
          <div class="max-h-48 space-y-1 overflow-y-auto">
            {#each security.auditLog as entry (entry.timestamp + entry.action)}
              <div class="flex items-center justify-between gap-2 py-1 text-xs">
                <div class="min-w-0 truncate">
                  <span class="text-[var(--text)]">{entry.username}</span>
                  <span class="text-[var(--text-muted)]"> {entry.action}</span>
                </div>
                <span class="shrink-0 text-[var(--text-muted)]">{formatTimeAgo(entry.timestamp)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    </div>
  {/if}
{/if}

<!-- Generic confirmation modal -->
<Modal open={!!confirmState} label="Confirmar acción" title={confirmState?.title} onClose={() => { if (!confirmBusy) confirmState = null; }}>
  {#if confirmState}
    <div class="space-y-4">
      <p class="text-sm leading-relaxed text-[var(--text-muted)]">{confirmState.message}</p>
      <div class="flex justify-end gap-2">
        <Button variant="ghost" onclick={() => (confirmState = null)} disabled={confirmBusy}>Cancelar</Button>
        <Button variant={confirmState.danger ? 'danger' : 'primary'} loading={confirmBusy} onclick={() => void runConfirm()}>
          Confirmar
        </Button>
      </div>
    </div>
  {/if}
</Modal>

<!-- Full audit modal -->
<Modal open={auditOpen} label="Auditoría completa" title="Auditoría completa" size="lg" onClose={() => (auditOpen = false)}>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <input
        type="text"
        bind:value={auditFilter}
        placeholder="Filtrar por acción (p.ej. login)"
        class="input-field text-xs"
        aria-label="Filtrar por acción"
        onkeydown={(e) => { if (e.key === 'Enter') { auditOffset = 0; void loadAuditPage(); } }}
      />
      <Button variant="secondary" size="sm" onclick={() => { auditOffset = 0; void loadAuditPage(); }}>Filtrar</Button>
    </div>

    {#if auditLoading}
      <div class="flex justify-center py-6"><Spinner size="md" /></div>
    {:else if audit && audit.entries.length > 0}
      <div class="max-h-80 overflow-y-auto rounded-lg border border-[var(--border)]">
        <table class="w-full text-left text-xs">
          <thead class="sticky top-0 bg-[var(--surface-2)] text-[var(--text-muted)]">
            <tr>
              <th class="px-3 py-2 font-medium">Usuario</th>
              <th class="px-3 py-2 font-medium">Acción</th>
              <th class="px-3 py-2 font-medium">IP</th>
              <th class="px-3 py-2 font-medium">País</th>
              <th class="px-3 py-2 font-medium">Cuándo</th>
            </tr>
          </thead>
          <tbody>
            {#each audit.entries as entry (entry.timestamp + entry.action + entry.username)}
              <tr class="border-t border-[var(--border)]">
                <td class="px-3 py-1.5 text-[var(--text)]">{entry.username}</td>
                <td class="px-3 py-1.5 text-[var(--text-muted)]">{entry.action}</td>
                <td class="px-3 py-1.5"><code class="text-[var(--text-muted)]">{entry.ip}</code></td>
                <td class="px-3 py-1.5 text-[var(--brand)]">{entry.country}</td>
                <td class="px-3 py-1.5 text-[var(--text-muted)]" title={entry.timestamp}>{formatTimeAgo(entry.timestamp)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{auditOffset + 1}–{Math.min(auditOffset + AUDIT_PAGE_SIZE, audit.total)} de {audit.total}</span>
        <div class="flex gap-1">
          <Button variant="ghost" size="sm" disabled={auditOffset === 0} onclick={() => { auditOffset = Math.max(0, auditOffset - AUDIT_PAGE_SIZE); void loadAuditPage(); }} aria-label="Página anterior">
            <ChevronLeft size={14} aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" disabled={auditOffset + AUDIT_PAGE_SIZE >= audit.total} onclick={() => { auditOffset += AUDIT_PAGE_SIZE; void loadAuditPage(); }} aria-label="Página siguiente">
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    {:else}
      <p class="py-6 text-center text-sm text-[var(--text-muted)]">Sin resultados</p>
    {/if}
  </div>
</Modal>
