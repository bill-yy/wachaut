<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { logout, isLoggedIn, getMetrics, getRooms, getStats, getSecurity, setMaintenance, type AdminMetrics, type AdminRoom, type AdminStats, type AdminSecurity } from '$lib/admin';
  import Brand from '$lib/components/Brand.svelte';
  import Pill from '$lib/components/Pill.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { Activity, Users, Server, Globe, Lock, Wrench, LogOut, Settings } from 'lucide-svelte';

  let metrics = $state<AdminMetrics | null>(null);
  let rooms = $state<AdminRoom[]>([]);
  let stats = $state<AdminStats | null>(null);
  let security = $state<AdminSecurity | null>(null);
  let loading = $state(true);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    if (!isLoggedIn()) { goto('/admin'); return; }
    await loadAll();
    // Poll metrics + rooms every 5s for live data.
    pollTimer = setInterval(loadLive, 5000);
  });

  onDestroy(() => { if (pollTimer) clearInterval(pollTimer); });

  async function loadAll() {
    loading = true;
    try {
      await Promise.all([loadLive(), loadStats(), loadSecurity()]);
    } catch (err: any) {
      if (err.message === 'Session expired') goto('/admin');
      else toast.error(err?.message || 'Error al cargar datos');
    } finally {
      loading = false;
    }
  }

  async function loadLive() {
    try {
      const [m, r] = await Promise.all([getMetrics(), getRooms()]);
      metrics = m;
      rooms = r.rooms;
    } catch (err: any) {
      if (err.message === 'Session expired') { goto('/admin'); }
    }
  }

  async function loadStats() {
    stats = await getStats();
  }

  async function loadSecurity() {
    security = await getSecurity();
  }

  function handleLogout() {
    logout();
    goto('/admin');
  }

  async function toggleMaintenance() {
    if (!metrics) return;
    try {
      const res = await setMaintenance(!metrics.maintenance);
      metrics.maintenance = res.maintenance;
      toast.success(res.maintenance ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado');
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  }

  function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
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

  // Max country count for bar chart scaling.
  let maxCountryCount = $derived(stats ? Math.max(...stats.countries.map(c => c.count), 1) : 1);
</script>

<div class="min-h-screen bg-[var(--bg)]">
  <!-- Header -->
  <header class="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-lg">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <div class="flex items-center gap-3">
        <Brand size="sm" />
        <span class="hidden text-xs text-[var(--text-muted)] sm:inline">Panel admin</span>
      </div>
      <div class="flex items-center gap-2">
        <a href="/admin/users" class="btn-ghost flex items-center gap-1.5 text-sm" aria-label="Gestión de usuarios">
          <Settings size={16} />
          <span class="hidden sm:inline">Usuarios</span>
        </a>
        <button onclick={handleLogout} class="btn-ghost flex items-center gap-1.5 text-sm" aria-label="Cerrar sesión">
          <LogOut size={16} />
          <span class="hidden sm:inline">Salir</span>
        </button>
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-4 py-6">
    {#if loading && !metrics}
      <div class="flex h-64 items-center justify-center text-[var(--text-muted)]">Cargando…</div>
    {:else if metrics}
      <!-- Metric cards -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div class="flex items-center gap-2 text-[var(--text-muted)]">
            <Users size={16} />
            <span class="text-xs font-medium">Salas activas</span>
          </div>
          <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{metrics.rooms}</p>
        </div>
        <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div class="flex items-center gap-2 text-[var(--text-muted)]">
            <Activity size={16} />
            <span class="text-xs font-medium">Viewers</span>
          </div>
          <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{metrics.viewers}</p>
        </div>
        <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div class="flex items-center gap-2 text-[var(--text-muted)]">
            <Server size={16} />
            <span class="text-xs font-medium">Conexiones</span>
          </div>
          <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{metrics.connections}</p>
        </div>
        <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div class="flex items-center gap-2 text-[var(--text-muted)]">
            <Globe size={16} />
            <span class="text-xs font-medium">SFU Workers</span>
          </div>
          <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{metrics.sfu?.workers ?? '?'}</p>
        </div>
      </div>

      <!-- System status + maintenance -->
      <div class="mt-4 flex flex-wrap items-center gap-3">
        {#if metrics.sfu}
          <Pill tone="success" pulse>SFU: {metrics.sfu.status}</Pill>
        {:else}
          <Pill tone="danger">SFU: unreachable</Pill>
        {/if}
        <Pill tone={metrics.maintenance ? 'danger' : 'neutral'}>
          Uptime: {formatUptime(metrics.uptime)}
        </Pill>
        <Pill tone="neutral">RAM: {metrics.memory}MB</Pill>
        <div class="ml-auto">
          <button
            onclick={toggleMaintenance}
            class={metrics.maintenance ? 'btn-danger flex items-center gap-1.5 text-sm' : 'btn-secondary flex items-center gap-1.5 text-sm'}
          >
            <Wrench size={16} />
            {metrics.maintenance ? 'Desactivar mantenimiento' : 'Modo mantenimiento'}
          </button>
        </div>
      </div>

      <!-- Two column layout: rooms + stats -->
      <div class="mt-6 grid gap-4 lg:grid-cols-2">
        <!-- Active rooms -->
        <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 class="mb-3 text-sm font-bold text-[var(--text)]">Salas activas ({rooms.length})</h2>
          {#if rooms.length === 0}
            <p class="py-8 text-center text-sm text-[var(--text-muted)]">No hay salas activas</p>
          {:else}
            <div class="max-h-96 space-y-2 overflow-y-auto">
              {#each rooms as room}
                <div class="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                  <div class="flex items-center justify-between">
                    <code class="text-xs text-[var(--text-muted)]">{room.id.slice(0, 8)}…</code>
                    <div class="flex items-center gap-2">
                      {#if room.isSharing}
                        <Pill tone="success">compartiendo</Pill>
                      {:else}
                        <Pill tone="neutral">inactivo</Pill>
                      {/if}
                      <span class="text-xs text-[var(--text-muted)]">{room.viewerCount} 👥</span>
                    </div>
                  </div>
                  {#if room.viewers.length > 0}
                    <div class="mt-2 flex flex-wrap gap-1">
                      {#each room.viewers.slice(0, 8) as v}
                        <span class="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[0.65rem] text-[var(--text-muted)]">{v.name}</span>
                      {/each}
                      {#if room.viewers.length > 8}
                        <span class="text-[0.65rem] text-[var(--text-muted)]">+{room.viewers.length - 8}</span>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Countries + stats -->
        <div class="space-y-4">
          {#if stats}
            <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 class="mb-3 text-sm font-bold text-[var(--text)]">Tráfico por país</h2>
              {#if stats.countries.length === 0}
                <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin datos aún</p>
              {:else}
                <div class="space-y-2">
                  {#each stats.countries as c}
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
            </div>

            <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold text-[var(--text)]">Total salas creadas</h2>
                <span class="text-2xl font-bold text-[var(--brand)]">{stats.totalRoomsCreated}</span>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Security panel -->
      {#if security}
        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 class="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <Lock size={16} /> IPs conectadas
            </h2>
            {#if security.ips.length === 0}
              <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin conexiones</p>
            {:else}
              <div class="max-h-48 space-y-1 overflow-y-auto">
                {#each security.ips.slice(0, 15) as ip}
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
          </div>

          <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 class="mb-3 text-sm font-bold text-[var(--text)]">Auditoría reciente</h2>
            {#if security.auditLog.length === 0}
              <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin eventos</p>
            {:else}
              <div class="max-h-48 space-y-1 overflow-y-auto">
                {#each security.auditLog.slice(0, 15) as entry}
                  <div class="flex items-center justify-between py-1 text-xs">
                    <div>
                      <span class="text-[var(--text)]">{entry.username}</span>
                      <span class="text-[var(--text-muted)]"> {entry.action}</span>
                    </div>
                    <span class="text-[var(--text-muted)]">{formatTimeAgo(entry.timestamp)}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </main>
</div>
