<script lang="ts">
  /**
   * Multi-series SVG time chart (line + soft area). No chart library —
   * hand-rolled to keep the admin bundle tiny and the look on-system.
   * Hover shows a guide line + tooltip with every series value.
   */
  import { cn } from '$lib/utils/cn';

  interface Point {
    bucket: string;
    [key: string]: number | string;
  }

  interface SeriesDef {
    key: string;
    label: string;
    /** CSS color (token var) for stroke + area gradient. */
    color: string;
  }

  let {
    data,
    series,
    height = 220,
    formatBucket,
  }: {
    data: Point[];
    series: SeriesDef[];
    height?: number;
    formatBucket?: (bucket: string) => string;
  } = $props();

  let hoverIndex = $state<number | null>(null);
  let svgEl = $state<SVGSVGElement | null>(null);

  const W = 1000;
  const H = 300;
  const PAD = { top: 12, right: 8, bottom: 26, left: 34 };

  const label = (b: string) =>
    formatBucket ? formatBucket(b) : b.includes('T') ? b.slice(11, 16) : b.slice(5);

  let maxValue = $derived(Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0))));

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  function x(i: number): number {
    if (data.length <= 1) return PAD.left + innerW / 2;
    return PAD.left + (i / (data.length - 1)) * innerW;
  }
  function y(v: number): number {
    return PAD.top + innerH - (v / maxValue) * innerH;
  }

  function pointsFor(key: string): string {
    return data.map((d, i) => `${x(i)},${y(Number(d[key]) || 0)}`).join(' ');
  }
  function areaFor(key: string): string {
    if (data.length === 0) return '';
    const base = PAD.top + innerH;
    return `${PAD.left},${base} ${pointsFor(key)} ${x(data.length - 1)},${base}`;
  }

  const gridLines = $derived([0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f)));

  // X tick labels: at most ~6, evenly spaced.
  const tickIdx = $derived(
    data.length <= 1
      ? [0]
      : Array.from({ length: Math.min(6, data.length) }, (_, k) =>
          Math.round((k / (Math.min(6, data.length) - 1)) * (data.length - 1))
        )
  );

  let uid = $state('');
  $effect(() => {
    // Per-instance gradient ids (multiple charts on one page).
    uid = `ts${Math.random().toString(36).slice(2, 8)}`;
  });

  function onMove(e: MouseEvent): void {
    const svg = svgEl;
    if (!svg || data.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(((rel * W) - PAD.left) / innerW * (data.length - 1));
    hoverIndex = Math.max(0, Math.min(data.length - 1, idx));
  }
</script>

<div class="relative w-full select-none" style="height: {height}px">
  <svg
    bind:this={svgEl}
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="none"
    class="h-full w-full"
    role="img"
    aria-label="Gráfica temporal"
    onmousemove={onMove}
    onmouseleave={() => (hoverIndex = null)}
  >
    <defs>
      {#each series as s (s.key)}
        <linearGradient id="{uid}-{s.key}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={s.color} stop-opacity="0.28" />
          <stop offset="100%" stop-color={s.color} stop-opacity="0.02" />
        </linearGradient>
      {/each}
    </defs>

    <!-- horizontal grid -->
    {#each gridLines as v (v)}
      <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--border)" stroke-width="1" />
      <text x={PAD.left - 6} y={y(v) + 4} text-anchor="end" font-size="12" fill="var(--text-subtle)">
        {v >= 10000 ? `${Math.round(v / 1000)}k` : v}
      </text>
    {/each}

    <!-- x tick labels -->
    {#each tickIdx as i (i)}
      {#if data[i]}
        <text x={x(i)} y={H - 8} text-anchor="middle" font-size="12" fill="var(--text-subtle)">
          {label(String(data[i].bucket))}
        </text>
      {/if}
    {/each}

    <!-- series -->
    {#each series as s (s.key)}
      <polygon points={areaFor(s.key)} fill="url(#{uid}-{s.key})" />
      <polyline
        points={pointsFor(s.key)}
        fill="none"
        stroke={s.color}
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    {/each}

    <!-- hover guide -->
    {#if hoverIndex !== null && data[hoverIndex]}
      <line
        x1={x(hoverIndex)} x2={x(hoverIndex)}
        y1={PAD.top} y2={PAD.top + innerH}
        stroke="var(--brand)" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"
      />
      {#each series as s (s.key)}
        <circle cx={x(hoverIndex)} cy={y(Number(data[hoverIndex][s.key]) || 0)} r="3.5" fill={s.color} />
      {/each}
    {/if}
  </svg>

  <!-- tooltip (HTML, outside SVG so text isn't scaled) -->
  {#if hoverIndex !== null && data[hoverIndex]}
    <div
      class="pointer-events-none absolute z-10 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-xs shadow-lg"
      style="left: clamp(0px, {(x(hoverIndex) / W) * 100}% - 70px, calc(100% - 150px)); top: 4px; min-width: 140px"
    >
      <p class="mb-1 font-medium text-[var(--text)]">{label(String(data[hoverIndex].bucket))}</p>
      {#each series as s (s.key)}
        <p class="flex items-center justify-between gap-3">
          <span class="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span class="inline-block h-2 w-2 rounded-full" style="background: {s.color}"></span>
            {s.label}
          </span>
          <span class="font-mono text-[var(--text)]">{Number(data[hoverIndex][s.key]) || 0}</span>
        </p>
      {/each}
    </div>
  {/if}
</div>

{#if series.length > 1}
  <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
    {#each series as s (s.key)}
      <span class="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <span class="inline-block h-2 w-2 rounded-full" style="background: {s.color}"></span>
        {s.label}
      </span>
    {/each}
  </div>
{/if}
