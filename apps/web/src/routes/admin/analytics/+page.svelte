<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getAnalytics, type AdminAnalytics } from '$lib/admin';
  import { adminSession } from '$lib/admin-session.svelte';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import {
    Users, Activity, FileClock, DoorOpen, Tv, Globe, Link2, Megaphone, Monitor, RefreshCw, TrendingUp, TrendingDown,
  } from 'lucide-svelte';

  let analytics = $state<AdminAnalytics | null>(null);
  let days = $state<7 | 30>(7);
  let loading = $state(true);
  let loadError = $state('');
  let refreshing = $state(false);

  onMount(() => {
    if (!adminSession.token) { goto('/admin'); return; }
    void load();
  });

  async function load() {
    loading = true;
    loadError = '';
    try {
      analytics = await getAnalytics(days);
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
      analytics = await getAnalytics(days);
      toast.success('Analítica actualizada');
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      refreshing = false;
    }
  }

  function setDays(d: 7 | 30) {
    if (days === d) return;
    days = d;
    void load();
  }

  function formatDay(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  function deltaTone(d: number | null): string {
    if (d === null) return 'text-[var(--text-subtle)]';
    return d >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]';
  }

  let maxVisitors = $derived(analytics ? Math.max(...analytics.series.map((s) => s.visitors), 1) : 1);
  let maxPageviews = $derived(analytics ? Math.max(...analytics.series.map((s) => s.pageviews), 1) : 1);

  const kpis = $derived(analytics ? [
    { icon: Users, label: 'Visitantes únicos', value: analytics.today.visitors, delta: analytics.today.delta.visitors },
    { icon: Activity, label: 'Sesiones', value: analytics.today.sessions, delta: analytics.today.delta.sessions },
    { icon: FileClock, label: 'Páginas vistas', value: analytics.today.pageviews, delta: analytics.today.delta.pageviews },
    { icon: DoorOpen, label: 'Salas creadas', value: analytics.today.rooms, delta: analytics.today.delta.rooms },
    { icon: Tv, label: 'Viewers', value: analytics.today.viewers, delta: analytics.today.delta.viewers },
  ] : []);
</script>

<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
  <h1 class="text-lg font-bold text-[var(--text)]">Analítica de tráfico</h1>
  <div class="flex items-center gap-2">
    <div class="flex overflow-hidden rounded-lg border border-[var(--border)]" role="group" aria-label="Rango de fechas">
      <button
        onclick={() => setDays(7)}
        class="px-3 py-1.5 text-xs {days === 7 ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}"
        aria-pressed={days === 7}
      >
        7 días
      </button>
      <button
        onclick={() => setDays(30)}
        class="px-3 py-1.5 text-xs {days === 30 ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}"
        aria-pressed={days === 30}
      >
        30 días
      </button>
    </div>
    <Button variant="ghost" size="sm" loading={refreshing} onclick={() => void refresh()} aria-label="Refrescar analítica">
      <RefreshCw size={14} aria-hidden="true" />
    </Button>
  </div>
</div>

{#if analytics && analytics.series.every((s) => s.pageviews === 0)}
  <Card class="mb-4 p-4 text-sm text-[var(--text-muted)]">
    Las métricas empezaron a registrarse con el despliegue del sistema de analítica — los datos de días anteriores no
    existen. A partir de ahora cada visita queda registrada.
  </Card>
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
  <!-- KPI cards: today vs yesterday -->
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
        <p class="mt-1 text-[0.65rem] text-[var(--text-subtle)]">vs ayer</p>
      </Card>
    {/each}
  </div>

  <!-- Daily series -->
  <div class="mt-4 grid gap-4 lg:grid-cols-2">
    <Card class="p-4">
      <h2 class="mb-3 text-sm font-bold text-[var(--text)]">Visitantes únicos por día</h2>
      <div class="space-y-2">
        {#each analytics.series as day (day.date)}
          <div class="flex items-center gap-2" title="Sesiones: {day.sessions} · Salas: {day.rooms}">
            <span class="w-14 shrink-0 text-xs text-[var(--text-muted)]">{formatDay(day.date)}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg)]">
              <div
                class="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]"
                style="width: {(day.visitors / maxVisitors) * 100}%"
              ></div>
            </div>
            <span class="w-8 shrink-0 text-right text-xs text-[var(--text-muted)]">{day.visitors}</span>
          </div>
        {/each}
      </div>
    </Card>

    <Card class="p-4">
      <h2 class="mb-3 text-sm font-bold text-[var(--text)]">Páginas vistas por día</h2>
      <div class="space-y-2">
        {#each analytics.series as day (day.date)}
          <div class="flex items-center gap-2" title="Visitantes: {day.visitors} · Viewers: {day.viewers}">
            <span class="w-14 shrink-0 text-xs text-[var(--text-muted)]">{formatDay(day.date)}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg)]">
              <div
                class="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]"
                style="width: {(day.pageviews / maxPageviews) * 100}%"
              ></div>
            </div>
            <span class="w-10 shrink-0 text-right text-xs text-[var(--text-muted)]">{day.pageviews}</span>
          </div>
        {/each}
      </div>
    </Card>
  </div>

  <!-- Sources: referrers + campaigns (SEM) -->
  <div class="mt-4 grid gap-4 lg:grid-cols-2">
    <Card class="p-4">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
        <Link2 size={16} aria-hidden="true" /> Origen del tráfico
      </h2>
      {#if analytics.referrers.length === 0}
        <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin datos aún — aparecerán con las primeras visitas</p>
      {:else}
        <div class="max-h-64 space-y-1 overflow-y-auto">
          {#each analytics.referrers as r (r.host)}
            <div class="flex items-center justify-between py-1 text-xs">
              <span class="truncate text-[var(--text)]">{r.host}</span>
              <span class="flex shrink-0 items-center gap-3 text-[var(--text-muted)]">
                <span>{r.sessions} sesiones</span>
                <span class="text-[var(--brand)]">{r.visitors} visit.</span>
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <Card class="p-4">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
        <Megaphone size={16} aria-hidden="true" /> Campañas (UTM)
      </h2>
      {#if analytics.campaigns.length === 0}
        <p class="py-4 text-center text-sm text-[var(--text-muted)]">
          Sin campañas todavía — cuando lances anuncios con UTMs
          (<code class="rounded bg-[var(--surface-2)] px-1 text-[0.65rem] text-[var(--brand)]">?utm_source=…</code>)
          las verás aquí
        </p>
      {:else}
        <div class="max-h-64 overflow-y-auto rounded-lg border border-[var(--border)]">
          <table class="w-full text-left text-xs">
            <thead class="bg-[var(--surface-2)] text-[var(--text-muted)]">
              <tr>
                <th class="px-3 py-2 font-medium">Origen</th>
                <th class="px-3 py-2 font-medium">Medio</th>
                <th class="px-3 py-2 font-medium">Campaña</th>
                <th class="px-3 py-2 text-right font-medium">Sesiones</th>
                <th class="px-3 py-2 text-right font-medium">Visitantes</th>
              </tr>
            </thead>
            <tbody>
              {#each analytics.campaigns as c (c.source + c.medium + c.campaign)}
                <tr class="border-t border-[var(--border)]">
                  <td class="px-3 py-1.5 text-[var(--brand)]">{c.source}</td>
                  <td class="px-3 py-1.5 text-[var(--text-muted)]">{c.medium || '—'}</td>
                  <td class="px-3 py-1.5 text-[var(--text)]">{c.campaign || '—'}</td>
                  <td class="px-3 py-1.5 text-right text-[var(--text)]">{c.sessions}</td>
                  <td class="px-3 py-1.5 text-right text-[var(--text-muted)]">{c.visitors}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card>
  </div>

  <!-- Pages + countries + devices -->
  <div class="mt-4 grid gap-4 lg:grid-cols-3">
    <Card class="p-4">
      <h2 class="mb-3 text-sm font-bold text-[var(--text)]">Páginas más vistas</h2>
      {#if analytics.pages.length === 0}
        <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin datos aún</p>
      {:else}
        <div class="max-h-56 space-y-1 overflow-y-auto">
          {#each analytics.pages as p (p.path)}
            <div class="flex items-center justify-between gap-2 py-1 text-xs">
              <code class="truncate text-[var(--text-muted)]" title={p.path}>{p.path}</code>
              <span class="shrink-0 text-[var(--text-muted)]">{p.views} <span class="text-[var(--brand)]">({p.visitors})</span></span>
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <Card class="p-4">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
        <Globe size={16} aria-hidden="true" /> Países (visitantes)
      </h2>
      {#if analytics.countries.length === 0}
        <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin datos aún</p>
      {:else}
        <div class="max-h-56 space-y-1 overflow-y-auto">
          {#each analytics.countries as c (c.country)}
            <div class="flex items-center justify-between py-1 text-xs">
              <span class="font-bold text-[var(--brand)]">{c.country}</span>
              <span class="text-[var(--text-muted)]">{c.visitors}</span>
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <Card class="p-4">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
        <Monitor size={16} aria-hidden="true" /> Dispositivos (sesiones)
      </h2>
      {#if analytics.devices.length === 0}
        <p class="py-4 text-center text-sm text-[var(--text-muted)]">Sin datos aún</p>
      {:else}
        <div class="space-y-1">
          {#each analytics.devices as d (d.device)}
            <div class="flex items-center justify-between py-1 text-xs">
              <span class="text-[var(--text)]">{d.device}</span>
              <span class="text-[var(--text-muted)]">{d.sessions}</span>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  </div>
{/if}
