<script lang="ts">
  /**
   * Error tracking + connection reliability.
   * Errors: grouped by fingerprint, workflow open → acknowledged → resolved
   * (a resolved group that reappears reopens automatically server-side).
   * Conexiones: host/viewer drops during broadcasts, causes and recovery.
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    getErrors, getErrorDetail, setErrorStatus, deleteErrorGroup, getConnections,
    type AdminErrorGroup, type AdminErrorDetail, type AdminConnections, type ErrorStatus,
  } from '$lib/admin';
  import { adminSession } from '$lib/admin-session.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Pill from '$lib/components/Pill.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { RefreshCw, Trash2, WifiOff, TrendingUp } from 'lucide-svelte';

  let groups = $state<AdminErrorGroup[]>([]);
  let total = $state(0);
  let loading = $state(true);
  let loadError = $state('');
  let statusFilter = $state<'' | ErrorStatus>('');
  let sourceFilter = $state('');

  let detail = $state<AdminErrorDetail | null>(null);
  let detailOpen = $state(false);
  let detailBusy = $state(false);

  let confirmDelete = $state<AdminErrorGroup | null>(null);
  let deleteBusy = $state(false);

  let connections = $state<AdminConnections | null>(null);

  onMount(() => {
    if (!adminSession.token) { goto('/admin'); return; }
    void load();
  });

  async function load() {
    loading = true;
    loadError = '';
    try {
      const [errPage, conn] = await Promise.all([
        getErrors({ status: statusFilter || undefined, source: sourceFilter || undefined }),
        getConnections(7),
      ]);
      groups = errPage.groups;
      total = errPage.total;
      connections = conn;
    } catch (err: any) {
      if (err.message === 'Session expired') goto('/admin');
      else loadError = err?.message || 'Error al cargar';
    } finally {
      loading = false;
    }
  }

  async function openDetail(g: AdminErrorGroup) {
    detailOpen = true;
    detailBusy = true;
    try {
      detail = await getErrorDetail(g.id);
    } catch (err: any) {
      toast.error(err?.message || 'Error');
      detailOpen = false;
    } finally {
      detailBusy = false;
    }
  }

  async function changeStatus(g: AdminErrorGroup, status: ErrorStatus) {
    try {
      await setErrorStatus(g.id, status);
      g.status = status;
      if (detail?.group.id === g.id) detail.group.status = status;
      toast.success(status === 'resolved' ? 'Marcado como resuelto' : status === 'acknowledged' ? 'Marcado como reconocido' : 'Reabierto');
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  }

  async function runDelete() {
    if (!confirmDelete) return;
    deleteBusy = true;
    try {
      await deleteErrorGroup(confirmDelete.id);
      toast.success('Grupo de errores eliminado');
      confirmDelete = null;
      detailOpen = false;
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      deleteBusy = false;
    }
  }

  function formatAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  }

  function formatDuration(ms: number | null): string {
    if (ms == null) return '—';
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    const m = Math.floor(ms / 60_000);
    if (m < 60) return `${m}min`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
  }

  function formatWhen(dateStr: string): string {
    return new Date(dateStr + 'Z').toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  const openCount = $derived(groups.filter((g) => g.status === 'open').length);
  const statusTone: Record<ErrorStatus, 'danger' | 'warning' | 'success'> = {
    open: 'danger',
    acknowledged: 'warning',
    resolved: 'success',
  };
  const statusLabel: Record<ErrorStatus, string> = {
    open: 'abierto',
    acknowledged: 'reconocido',
    resolved: 'resuelto',
  };
  const causeLabel: Record<string, string> = {
    network: '🔴 red',
    clean: '✓ salida limpia',
    server: '⚙ servidor',
  };
</script>

<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
  <h1 class="text-lg font-bold text-[var(--text)]">Errores y conexiones</h1>
  <Button variant="ghost" size="sm" onclick={() => void load()} aria-label="Refrescar">
    <RefreshCw size={14} aria-hidden="true" />
  </Button>
</div>

{#if loading}
  <div class="flex h-64 items-center justify-center gap-2 text-[var(--text-muted)]">
    <Spinner size="md" />
    Cargando…
  </div>
{:else if loadError}
  <Card class="flex flex-col items-center gap-4 p-10 text-center">
    <p class="text-sm text-[var(--danger)]">{loadError}</p>
    <Button variant="secondary" onclick={() => void load()}>Reintentar</Button>
  </Card>
{:else}
  <!-- KPIs -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    <Card class="p-4">
      <p class="text-xs font-medium text-[var(--text-muted)]">Errores abiertos</p>
      <p class="mt-2 text-2xl font-bold {openCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}">{openCount}</p>
    </Card>
    <Card class="p-4">
      <p class="text-xs font-medium text-[var(--text-muted)]">Total grupos</p>
      <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{total}</p>
    </Card>
    <Card class="p-4">
      <p class="text-xs font-medium text-[var(--text-muted)]">Cortes de host (7d)</p>
      <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{connections?.kpis.hostDrops ?? '—'}</p>
    </Card>
    <Card class="p-4">
      <p class="text-xs font-medium text-[var(--text-muted)]">Hosts recuperados</p>
      <p class="mt-2 flex items-baseline gap-1 text-2xl font-bold {connections?.kpis.hostRecoveredPct === 100 ? 'text-[var(--success)]' : 'text-[var(--brand)]'}">
        {connections?.kpis.hostRecoveredPct != null ? `${connections.kpis.hostRecoveredPct}%` : '—'}
      </p>
      {#if connections?.kpis.avgRecoveryMs != null}
        <p class="mt-1 text-[0.65rem] text-[var(--text-subtle)]">recuperación media {formatDuration(connections.kpis.avgRecoveryMs)}</p>
      {/if}
    </Card>
    <Card class="p-4">
      <p class="text-xs font-medium text-[var(--text-muted)]">Viewers por red (7d)</p>
      <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{connections?.kpis.viewerNetworkDrops ?? '—'}</p>
      {#if connections && connections.kpis.viewerNetworkDrops > 0}
        <p class="mt-1 flex items-center gap-1 text-[0.65rem] text-[var(--text-subtle)]">
          <TrendingUp size={10} aria-hidden="true" />
          {connections.kpis.viewerRecovered} volvieron
        </p>
      {/if}
    </Card>
  </div>

  <!-- Filters -->
  <div class="mt-4 flex flex-wrap items-center gap-2">
    <div class="flex overflow-hidden rounded-lg border border-[var(--border)]" role="group" aria-label="Filtrar por estado">
      {#each [['', 'Todos'], ['open', 'Abiertos'], ['acknowledged', 'Reconocidos'], ['resolved', 'Resueltos']] as [value, label]}
        <button
          onclick={() => { statusFilter = value as '' | ErrorStatus; void load(); }}
          class="px-3 py-1.5 text-xs {statusFilter === value ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}"
          aria-pressed={statusFilter === value}
        >
          {label}
        </button>
      {/each}
    </div>
    <div class="flex overflow-hidden rounded-lg border border-[var(--border)]" role="group" aria-label="Filtrar por origen">
      {#each [['', 'Todo origen'], ['web', 'Web'], ['server', 'Server'], ['sfu', 'SFU']] as [value, label]}
        <button
          onclick={() => { sourceFilter = value; void load(); }}
          class="px-3 py-1.5 text-xs {sourceFilter === value ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}"
          aria-pressed={sourceFilter === value}
        >
          {label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Error groups -->
  <div class="mt-3 space-y-2">
    {#if groups.length === 0}
      <Card class="p-8 text-center text-sm text-[var(--text-muted)]">
        No hay errores {statusFilter ? 'con ese filtro' : 'registrados'} — buena señal.
      </Card>
    {:else}
      {#each groups as g (g.id)}
        <Card class="flex flex-wrap items-center justify-between gap-3 p-4">
          <button class="min-w-0 flex-1 cursor-pointer text-left" onclick={() => void openDetail(g)} aria-label="Ver detalle de {g.title}">
            <div class="flex flex-wrap items-center gap-2">
              <Pill tone={statusTone[g.status]}>{statusLabel[g.status]}</Pill>
              <Badge tone={g.source === 'web' ? 'brand' : g.source === 'sfu' ? 'warning' : 'neutral'}>{g.source}</Badge>
              {#if g.severity === 'warning'}
                <Badge tone="warning">warning</Badge>
              {/if}
              <span class="text-xs text-[var(--text-subtle)]">{g.component}</span>
            </div>
            <p class="mt-1.5 truncate text-sm font-medium text-[var(--text)]" title={g.title}>{g.title}</p>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              {g.count} ocurrencias · último {formatAgo(g.last_seen)} · primero {formatAgo(g.first_seen)}
            </p>
          </button>
          <div class="flex shrink-0 items-center gap-1">
            {#if g.status === 'open'}
              <Button variant="ghost" size="sm" onclick={() => void changeStatus(g, 'acknowledged')}>Reconocer</Button>
            {/if}
            {#if g.status !== 'resolved'}
              <Button variant="secondary" size="sm" onclick={() => void changeStatus(g, 'resolved')}>Resolver</Button>
            {:else}
              <Button variant="ghost" size="sm" onclick={() => void changeStatus(g, 'open')}>Reabrir</Button>
            {/if}
            <Button variant="ghost" size="sm" onclick={() => (confirmDelete = g)} aria-label="Eliminar grupo">
              <Trash2 size={14} aria-hidden="true" />
            </Button>
          </div>
        </Card>
      {/each}
    {/if}
  </div>

  <!-- Connection reliability -->
  <h2 class="mb-3 mt-8 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
    <WifiOff size={16} aria-hidden="true" />
    Fiabilidad de conexiones (últimas 50 pérdidas)
  </h2>
  {#if !connections || connections.events.length === 0}
    <Card class="p-8 text-center text-sm text-[var(--text-muted)]">
      Sin pérdidas de conexión registradas todavía.
    </Card>
  {:else}
    <Card class="overflow-x-auto p-0">
      <table class="w-full text-left text-xs">
        <thead class="bg-[var(--surface-2)] text-[var(--text-muted)]">
          <tr>
            <th class="px-3 py-2 font-medium">Cuándo</th>
            <th class="px-3 py-2 font-medium">Rol</th>
            <th class="px-3 py-2 font-medium">Causa</th>
            <th class="px-3 py-2 font-medium">Sala</th>
            <th class="px-3 py-2 font-medium">Duración en sala</th>
            <th class="px-3 py-2 font-medium">Recuperado</th>
            <th class="px-3 py-2 font-medium">Viewers afectados</th>
          </tr>
        </thead>
        <tbody>
          {#each connections.events as ev (ev.ts + ev.room_id + ev.role)}
            <tr class="border-t border-[var(--border)]">
              <td class="px-3 py-1.5 text-[var(--text-muted)]">{formatWhen(ev.ts)}</td>
              <td class="px-3 py-1.5">
                {#if ev.role === 'host'}
                  <Badge tone="brand">host</Badge>
                {:else}
                  <Badge>viewer</Badge>
                {/if}
              </td>
              <td class="px-3 py-1.5">{causeLabel[ev.cause] ?? ev.cause}</td>
              <td class="px-3 py-1.5"><code class="text-[var(--text-muted)]" title={ev.room_id || ''}>{ev.room_id ? ev.room_id.slice(0, 8) + '…' : '—'}</code></td>
              <td class="px-3 py-1.5 text-[var(--text-muted)]">{formatDuration(ev.duration_ms)}</td>
              <td class="px-3 py-1.5">
                {#if ev.role === 'host'}
                  {#if ev.recovered}
                    <Badge tone="success">sí ({formatDuration(ev.recovery_ms)})</Badge>
                  {:else}
                    <Badge tone="danger">no</Badge>
                  {/if}
                {:else}
                  <span class="text-[var(--text-subtle)]">—</span>
                {/if}
              </td>
              <td class="px-3 py-1.5 text-[var(--text-muted)]">{ev.viewers_affected ?? '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </Card>
  {/if}
{/if}

<!-- Detail modal -->
<Modal open={detailOpen} label="Detalle del error" title={detail ? detail.group.title : 'Cargando…'} size="lg" onClose={() => (detailOpen = false)}>
  {#if detailBusy}
    <div class="flex justify-center py-6"><Spinner size="md" /></div>
  {:else if detail}
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <Pill tone={statusTone[detail.group.status]}>{statusLabel[detail.group.status]}</Pill>
        <Badge tone="brand">{detail.group.source}</Badge>
        <span class="text-[var(--text-subtle)]">{detail.group.component}</span>
        <span class="ml-auto text-[var(--text-muted)]">{detail.group.count} ocurrencias</span>
      </div>

      {#if detail.group.sample_stack}
        <div>
          <p class="mb-1 text-xs font-medium text-[var(--text-muted)]">Stack de ejemplo</p>
          <pre class="max-h-48 overflow-auto rounded-lg bg-[var(--bg)] p-3 text-[0.65rem] leading-relaxed text-[var(--text-muted)]">{detail.group.sample_stack}</pre>
        </div>
      {/if}

      <div>
        <p class="mb-1 text-xs font-medium text-[var(--text-muted)]">Últimos eventos ({detail.events.length})</p>
        <div class="max-h-44 overflow-y-auto rounded-lg border border-[var(--border)]">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-[var(--surface-2)] text-[var(--text-muted)]">
              <tr>
                <th class="px-2.5 py-1.5 font-medium">Cuándo</th>
                <th class="px-2.5 py-1.5 font-medium">Página</th>
                <th class="px-2.5 py-1.5 font-medium">Sala</th>
                <th class="px-2.5 py-1.5 font-medium">País</th>
              </tr>
            </thead>
            <tbody>
              {#each detail.events as ev (ev.ts + ev.message)}
                <tr class="border-t border-[var(--border)]">
                  <td class="px-2.5 py-1.5 text-[var(--text-muted)]">{formatWhen(ev.ts)}</td>
                  <td class="px-2.5 py-1.5"><code class="text-[var(--text-muted)]">{ev.page || '—'}</code></td>
                  <td class="px-2.5 py-1.5"><code class="text-[var(--text-muted)]">{ev.room_id ? ev.room_id.slice(0, 8) + '…' : '—'}</code></td>
                  <td class="px-2.5 py-1.5 text-[var(--brand)]">{ev.country || '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onclick={() => void changeStatus(detail!.group, 'open')} disabled={detail.group.status === 'open'}>Reabrir</Button>
        <Button variant="secondary" onclick={() => void changeStatus(detail!.group, 'acknowledged')} disabled={detail.group.status === 'acknowledged'}>Reconocer</Button>
        <Button onclick={() => void changeStatus(detail!.group, 'resolved')} disabled={detail.group.status === 'resolved'}>Resolver</Button>
        <Button variant="danger" onclick={() => (confirmDelete = detail!.group)}><Trash2 size={14} aria-hidden="true" />Eliminar</Button>
      </div>
    </div>
  {/if}
</Modal>

<!-- Delete confirmation -->
<Modal open={!!confirmDelete} label="Eliminar grupo de errores" title="Eliminar grupo de errores" onClose={() => { if (!deleteBusy) confirmDelete = null; }}>
  {#if confirmDelete}
    <div class="space-y-4">
      <p class="text-sm leading-relaxed text-[var(--text-muted)]">
        Se eliminarán <strong class="text-[var(--text)]">{confirmDelete.count}</strong> eventos de
        «{confirmDelete.title}». Esta acción no se puede deshacer.
      </p>
      <div class="flex justify-end gap-2">
        <Button variant="ghost" onclick={() => (confirmDelete = null)} disabled={deleteBusy}>Cancelar</Button>
        <Button variant="danger" loading={deleteBusy} onclick={() => void runDelete()}>Eliminar definitivamente</Button>
      </div>
    </div>
  {/if}
</Modal>
