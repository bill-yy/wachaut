<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    getAnalytics,
    downloadAnalyticsExport,
    type AdminAnalytics,
    type AnalyticsFilters,
  } from '$lib/admin';
  import { adminSession } from '$lib/admin-session.svelte';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import TimeSeriesChart from '$lib/components/admin/charts/TimeSeriesChart.svelte';
  import BarList from '$lib/components/admin/charts/BarList.svelte';
  import Sparkline from '$lib/components/admin/charts/Sparkline.svelte';
  import FunnelChart from '$lib/components/admin/charts/FunnelChart.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { cn } from '$lib/utils/cn';
  import {
    Users, Activity, FileClock, DoorOpen, Tv, Globe, Link2, Megaphone, Monitor,
    RefreshCw, TrendingUp, TrendingDown, Download, Languages, FilterX, Repeat,
    HeartPulse, CalendarRange,
  } from 'lucide-svelte';

  let analytics = $state<AdminAnalytics | null>(null);
  let loading = $state(true);
  let loadError = $state('');
  let refreshing = $state(false);

  // ── Range ──────────────────────────────────────────────────────────
  let rangeMode = $state<'7' | '30' | '90' | 'custom'>('7');
  let customFrom = $state(new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10));
  let customTo = $state(new Date().toISOString().slice(0, 10));

  // ── Cross-dimension filters ────────────────────────────────────────
  let filters = $state<AnalyticsFilters>({});

  // ── Auto refresh ───────────────────────────────────────────────────
  let autoRefresh = $state(false);

  const METRICS = [
    { key: 'visitors', label: 'Visitantes', color: 'var(--brand)' },
    { key: 'sessions', label: 'Sesiones', color: 'var(--accent)' },
    { key: 'pageviews', label: 'Páginas', color: 'var(--success)' },
    { key: 'rooms', label: 'Salas', color: 'var(--danger)' },
    { key: 'viewers', label: 'Viewers', color: 'var(--text-subtle)' },
  ] as const;
  let activeMetrics = $state<string[]>(['visitors', 'pageviews']);

  let queryParams = $derived(
    rangeMode === 'custom'
      ? { from: customFrom, to: customTo, ...filters }
      : { days: Number(rangeMode), ...filters }
  );

  onMount(() => {
    if (!adminSession.token) { goto('/admin'); return; }
    void load();
  });

  $effect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (!document.hidden) void load(true);
    }, 30_000);
    return () => clearInterval(id);
  });

  async function load(silent = false) {
    if (!silent) loading = true;
    loadError = '';
    try {
      analytics = await getAnalytics(queryParams);
    } catch (err: any) {
      if (err.message === 'Session expired') goto('/admin');
      else loadError = err?.message || 'Error al cargar la analítica';
    } finally {
      loading = false;
    }
  }

  async function refresh() {
    refreshing = true;
    try {
      analytics = await getAnalytics(queryParams);
      toast.success('Analítica actualizada');
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      refreshing = false;
    }
  }

  // Reload whenever range or filters change.
  $effect(() => {
    void queryParams;
    if (adminSession.token) void load();
  });

  function setRange(mode: '7' | '30' | '90' | 'custom') {
    if (mode !== 'custom' && rangeMode === mode) return;
    rangeMode = mode;
  }

  function toggleFilter(dimension: keyof AnalyticsFilters, value: string) {
    filters = { ...filters };
    if (filters[dimension] === value) delete filters[dimension];
    else filters[dimension] = value;
  }
  function clearFilters() {
    filters = {};
  }
  function toggleMetric(key: string) {
    activeMetrics = activeMetrics.includes(key)
      ? activeMetrics.filter((k) => k !== key)
      : [...activeMetrics, key];
  }

  async function exportCsv(section: string) {
    try {
      await downloadAnalyticsExport(section, queryParams);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo exportar');
    }
  }

  // ── Formatting ─────────────────────────────────────────────────────
  function formatBucket(bucket: string): string {
    if (bucket.includes('T')) {
      const [d, h] = bucket.split('T');
      return `${formatDay(d)} ${h}`;
    }
    return formatDay(bucket);
  }
  function formatDay(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  function formatMs(ms: number | null): string {
    if (ms == null) return '—';
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60_000)} min`;
  }
  function deltaTone(d: number | null): string {
    if (d === null) return 'text-[var(--text-subtle)]';
    return d >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]';
  }

  let chartSeries = $derived(METRICS.filter((m) => activeMetrics.includes(m.key)));
  let activeFilterChips = $derived(
    (Object.entries(filters) as [string, string][]).map(([dim, val]) => ({ dim, val }))
  );

  const kpis = $derived(analytics ? [
    { icon: Users, label: 'Visitantes únicos', value: analytics.today.visitors, delta: analytics.today.delta.visitors, spark: analytics.series.map((s) => s.visitors) },
    { icon: Activity, label: 'Sesiones', value: analytics.today.sessions, delta: analytics.today.delta.sessions, spark: analytics.series.map((s) => s.sessions) },
    { icon: FileClock, label: 'Páginas vistas', value: analytics.today.pageviews, delta: analytics.today.delta.pageviews, spark: analytics.series.map((s) => s.pageviews) },
    { icon: DoorOpen, label: 'Salas creadas', value: analytics.today.rooms, delta: analytics.today.delta.rooms, spark: analytics.series.map((s) => s.rooms) },
    { icon: Tv, label: 'Viewers', value: analytics.today.viewers, delta: analytics.today.delta.viewers, spark: analytics.series.map((s) => s.viewers) },
  ] : []);
</script>

<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
  <h1 class="text-lg font-bold text-[var(--text)]">Analítica</h1>

  <div class="flex flex-wrap items-center gap-2">
    <div class="flex overflow-hidden rounded-lg border border-[var(--border)]" role="group" aria-label="Rango de fechas">
      {#each [['7', '7 días'], ['30', '30 días'], ['90', '90 días'], ['custom', 'Personalizado']] as [mode, label] (mode)}
        <button
          onclick={() => setRange(mode as any)}
          class="px-3 py-1.5 text-xs {rangeMode === mode ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}"
          aria-pressed={rangeMode === mode}
        >
          {label}
        </button>
      {/each}
    </div>

    <label class="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-muted)]" title="Recargar cada 30 segundos (pausado si la pestaña está oculta)">
      <input type="checkbox" bind:checked={autoRefresh} class="accent-[var(--brand)]" />
      <Repeat size={13} aria-hidden="true" /> Auto
    </label>

    <Button variant="ghost" size="sm" loading={refreshing} onclick={() => void refresh()} aria-label="Refrescar analítica">
      <RefreshCw size={14} aria-hidden="true" />
    </Button>
  </div>
</div>

{#if rangeMode === 'custom'}
  <Card class="mb-4 flex flex-wrap items-end gap-3 p-3">
    <label class="text-xs text-[var(--text-muted)]">
      <span class="mb-1 flex items-center gap-1"><CalendarRange size={12} aria-hidden="true" /> Desde</span>
      <input type="date" bind:value={customFrom} max={customTo} class="input-field !px-2 !py-1 text-xs" />
    </label>
    <label class="text-xs text-[var(--text-muted)]">
      <span class="mb-1 block">Hasta</span>
      <input type="date" bind:value={customTo} min={customFrom} max={new Date().toISOString().slice(0, 10)} class="input-field !px-2 !py-1 text-xs" />
    </label>
    <p class="pb-2 text-[0.65rem] text-[var(--text-subtle)]">Rangos de ≤48h se muestran con granularidad horaria</p>
  </Card>
{/if}

{#if activeFilterChips.length > 0}
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <span class="text-xs text-[var(--text-subtle)]">Filtros:</span>
    {#each activeFilterChips as { dim, val } (dim)}
      <button
        onclick={() => toggleFilter(dim as keyof AnalyticsFilters, val)}
        class="flex items-center gap-1 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2.5 py-1 text-xs text-[var(--brand)] hover:bg-[var(--brand)]/20"
        aria-label="Quitar filtro {dim}: {val}"
      >
        {dim}: <strong class="font-medium">{val}</strong>
        <FilterX size={12} aria-hidden="true" />
      </button>
    {/each}
    <button onclick={clearFilters} class="text-xs text-[var(--text-subtle)] underline hover:text-[var(--text)]">
      limpiar todo
    </button>
  </div>
{/if}

{#if loading}
  <div class="flex h-64 items-center justify-center gap-2 text-[var(--text-muted)]">
    <Spinner size="md" />
    Cargando analítica…
  </div>
{:else if loadError}
  <Card class="flex flex-col items-center gap-4 p-10 text-center">
    <p class="text-sm text-[var(--danger)]">{loadError}</p>
    <Button variant="secondary" onclick={() => void load()}>Reintentar</Button>
  </Card>
{:else if analytics}
  {#if analytics.series.every((s) => s.pageviews === 0)}
    <Card class="mb-4 p-4 text-sm text-[var(--text-muted)]">
      Sin visitas en el rango seleccionado{activeFilterChips.length > 0 ? ' con estos filtros — prueba a quitarlos' : ''}.
    </Card>
  {/if}

  <!-- KPI cards: today vs yesterday, with range sparkline -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    {#each kpis as kpi (kpi.label)}
      <Card class="p-4">
        <div class="flex items-center gap-2 text-[var(--text-muted)]">
          <kpi.icon size={16} aria-hidden="true" />
          <span class="text-xs font-medium">{kpi.label}</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <p class="text-2xl font-bold text-[var(--brand)]">{kpi.value}</p>
          {#if kpi.delta !== null && kpi.delta !== undefined}
            <span class="inline-flex items-center gap-0.5 text-xs {deltaTone(kpi.delta)}">
              {#if kpi.delta >= 0}
                <TrendingUp size={12} aria-hidden="true" />
              {:else}
                <TrendingDown size={12} aria-hidden="true" />
              {/if}
              {kpi.delta > 0 ? '+' : ''}{kpi.delta}%
            </span>
          {/if}
        </div>
        <div class="mt-1 flex items-center justify-between gap-2">
          <p class="text-[0.65rem] text-[var(--text-subtle)]">hoy vs ayer</p>
          <Sparkline values={kpi.spark} width={84} height={24} />
        </div>
      </Card>
    {/each}
  </div>

  <!-- Audiencia: time series -->
  <Card class="mt-4 p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-sm font-bold text-[var(--text)]">Evolución</h2>
      <div class="flex flex-wrap gap-1" role="group" aria-label="Métricas mostradas">
        {#each METRICS as m (m.key)}
          <button
            onclick={() => toggleMetric(m.key)}
            class={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors',
              activeMetrics.includes(m.key)
                ? 'bg-[var(--surface-2)] text-[var(--text)]'
                : 'text-[var(--text-subtle)] hover:bg-[var(--surface-2)]'
            )}
            aria-pressed={activeMetrics.includes(m.key)}
          >
            <span class="inline-block h-2 w-2 rounded-full" style="background: {m.color}; opacity: {activeMetrics.includes(m.key) ? 1 : 0.35}"></span>
            {m.label}
          </button>
        {/each}
      </div>
    </div>
    {#if activeMetrics.length === 0}
      <p class="py-8 text-center text-sm text-[var(--text-muted)]">Selecciona al menos una métrica</p>
    {:else}
      <TimeSeriesChart data={analytics.series} series={chartSeries} formatBucket={formatBucket} />
    {/if}
  </Card>

  <!-- Tráfico: referrers + campaigns -->
  <div class="mt-4 grid gap-4 lg:grid-cols-2">
    <Card class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <Link2 size={16} aria-hidden="true" /> Origen del tráfico
        </h2>
        <button onclick={() => void exportCsv('referrers')} class="btn-ghost flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)]" aria-label="Exportar orígenes como CSV">
          <Download size={13} aria-hidden="true" /> CSV
        </button>
      </div>
      <BarList
        items={analytics.referrers.map((r) => ({ label: r.host, value: r.sessions, sub: `${r.visitors} visit.` }))}
        emptyText="Sin datos aún — aparecerán con las primeras visitas"
        activeLabel={filters.referrer}
        onSelect={(host) => toggleFilter('referrer', host)}
      />
    </Card>

    <Card class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <Megaphone size={16} aria-hidden="true" /> Campañas (UTM)
        </h2>
        <button onclick={() => void exportCsv('campaigns')} class="btn-ghost flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)]" aria-label="Exportar campañas como CSV">
          <Download size={13} aria-hidden="true" /> CSV
        </button>
      </div>
      {#if analytics.campaigns.length === 0}
        <p class="py-4 text-center text-sm text-[var(--text-muted)]">
          Sin campañas todavía — cuando lances anuncios con UTMs
          (<code class="rounded bg-[var(--surface-2)] px-1 text-[0.65rem] text-[var(--brand)]">?utm_source=…</code>)
          las verás aquí
        </p>
      {:else}
        <div class="max-h-64 overflow-y-auto rounded-lg border border-[var(--border)]">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-[var(--surface-2)] text-[var(--text-muted)]">
              <tr>
                <th class="px-3 py-2 font-medium">Origen</th>
                <th class="px-3 py-2 font-medium">Medio</th>
                <th class="px-3 py-2 font-medium">Campaña</th>
                <th class="px-3 py-2 text-right font-medium">Sesiones</th>
              </tr>
            </thead>
            <tbody>
              {#each analytics.campaigns as c (c.source + c.medium + c.campaign)}
                <tr class="border-t border-[var(--border)] {filters.campaign === c.campaign ? 'bg-[var(--brand)]/10' : ''}">
                  <td class="px-3 py-1.5 text-[var(--brand)]">{c.source}</td>
                  <td class="px-3 py-1.5 text-[var(--text-muted)]">{c.medium || '—'}</td>
                  <td class="px-3 py-1.5">
                    {#if c.campaign}
                      <button class="text-[var(--text)] underline-offset-2 hover:underline" onclick={() => toggleFilter('campaign', String(c.campaign))}>
                        {c.campaign}
                      </button>
                    {:else}
                      <span class="text-[var(--text-muted)]">—</span>
                    {/if}
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono text-[var(--text)]">{c.sessions}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card>
  </div>

  <!-- Páginas -->
  <Card class="mt-4 p-4">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-bold text-[var(--text)]">Páginas más vistas</h2>
      <button onclick={() => void exportCsv('pages')} class="btn-ghost flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)]" aria-label="Exportar páginas como CSV">
        <Download size={13} aria-hidden="true" /> CSV
      </button>
    </div>
    <BarList
      items={analytics.pages.map((p) => ({ label: p.path, value: p.views, sub: `${p.visitors} visit.` }))}
      emptyText="Sin datos aún"
      activeLabel={filters.path}
      onSelect={(path) => toggleFilter('path', path)}
    />
    <p class="mt-2 text-[0.65rem] text-[var(--text-subtle)]">Haz clic en cualquier fila para filtrar toda la analítica por esa página</p>
  </Card>

  <!-- Demografía: países, dispositivos, idiomas -->
  <div class="mt-4 grid gap-4 lg:grid-cols-3">
    <Card class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <Globe size={16} aria-hidden="true" /> Países
        </h2>
        <button onclick={() => void exportCsv('countries')} class="btn-ghost flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)]" aria-label="Exportar países como CSV">
          <Download size={13} aria-hidden="true" />
        </button>
      </div>
      <BarList
        items={analytics.countries.map((c) => ({ label: c.country, value: c.visitors }))}
        activeLabel={filters.country}
        onSelect={(country) => toggleFilter('country', country)}
      />
    </Card>

    <Card class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <Monitor size={16} aria-hidden="true" /> Dispositivos
        </h2>
        <button onclick={() => void exportCsv('devices')} class="btn-ghost flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)]" aria-label="Exportar dispositivos como CSV">
          <Download size={13} aria-hidden="true" />
        </button>
      </div>
      <BarList
        items={analytics.devices.map((d) => ({ label: d.device, value: d.sessions }))}
        activeLabel={filters.device}
        onSelect={(device) => toggleFilter('device', device)}
      />
    </Card>

    <Card class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <Languages size={16} aria-hidden="true" /> Idiomas
        </h2>
        <button onclick={() => void exportCsv('langs')} class="btn-ghost flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)]" aria-label="Exportar idiomas como CSV">
          <Download size={13} aria-hidden="true" />
        </button>
      </div>
      <BarList
        items={analytics.langs.map((l) => ({ label: l.lang, value: l.sessions }))}
        activeLabel={filters.lang}
        onSelect={(lang) => toggleFilter('lang', lang)}
      />
    </Card>
  </div>

  <!-- Producto: funnel + fiabilidad -->
  <div class="mt-4 grid gap-4 lg:grid-cols-2">
    <Card class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-bold text-[var(--text)]">Embudo del producto</h2>
        <button onclick={() => void exportCsv('series')} class="btn-ghost flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)]" aria-label="Exportar serie temporal como CSV">
          <Download size={13} aria-hidden="true" /> CSV
        </button>
      </div>
      <FunnelChart
        steps={[
          { label: 'Visitas a la landing', value: analytics.funnel.landingSessions, hint: 'sesiones' },
          { label: 'Salas creadas', value: analytics.funnel.roomsCreated, hint: 'hosts' },
          { label: 'Salas con ≥1 viewer', value: analytics.funnel.roomsWithViewers, hint: 'compartidas' },
          { label: 'Viewers que entraron', value: analytics.funnel.viewerJoins, hint: 'uniones' },
        ]}
      />
    </Card>

    <Card class="p-4">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
        <HeartPulse size={16} aria-hidden="true" /> Fiabilidad de conexiones
      </h2>
      <dl class="grid grid-cols-2 gap-3 text-xs">
        <div class="rounded-lg bg-[var(--surface-2)] p-3">
          <dt class="text-[var(--text-subtle)]">Recuperación del host</dt>
          <dd class="mt-1 text-lg font-bold {analytics.reliability.recoveryRatePct != null && analytics.reliability.recoveryRatePct >= 80 ? 'text-[var(--success)]' : 'text-[var(--brand)]'}">
            {analytics.reliability.recoveryRatePct != null ? `${analytics.reliability.recoveryRatePct}%` : '—'}
          </dd>
          <p class="text-[0.65rem] text-[var(--text-subtle)]">
            {analytics.reliability.hostRecovered}/{analytics.reliability.hostDrops} caídas recuperadas
          </p>
        </div>
        <div class="rounded-lg bg-[var(--surface-2)] p-3">
          <dt class="text-[var(--text-subtle)]">Tiempo medio de visión</dt>
          <dd class="mt-1 text-lg font-bold text-[var(--brand)]">{formatMs(analytics.reliability.avgWatchMs)}</dd>
          <p class="text-[0.65rem] text-[var(--text-subtle)]">por desconexión de viewer</p>
        </div>
        <div class="rounded-lg bg-[var(--surface-2)] p-3">
          <dt class="text-[var(--text-subtle)]">Caídas de viewers</dt>
          <dd class="mt-1 text-lg font-bold text-[var(--text)]">{analytics.reliability.viewerDrops}</dd>
          <p class="text-[0.65rem] text-[var(--text-subtle)]">{analytics.reliability.viewerNetworkDrops} por red</p>
        </div>
        <div class="rounded-lg bg-[var(--surface-2)] p-3">
          <dt class="text-[var(--text-subtle)]">Latencia de recuperación</dt>
          <dd class="mt-1 text-lg font-bold text-[var(--text)]">{formatMs(analytics.reliability.avgRecoveryMs)}</dd>
          <p class="text-[0.65rem] text-[var(--text-subtle)]">media del host al reconectar</p>
        </div>
      </dl>
    </Card>
  </div>
{/if}
