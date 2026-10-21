<script lang="ts">
  /** Tiny inline sparkline for KPI cards. */
  let { values, width = 120, height = 32 }: { values: number[]; width?: number; height?: number } = $props();

  const max = $derived(Math.max(1, ...values));
  const points = $derived(
    values.length <= 1
      ? ''
      : values
          .map((v, i) => `${(i / (values.length - 1)) * width},${height - (v / max) * (height - 4) - 2}`)
          .join(' ')
  );
</script>

{#if values.length > 1}
  <svg viewBox="0 0 {width} {height}" width={width} height={height} aria-hidden="true" class="opacity-80">
    <polyline
      points={points}
      fill="none"
      stroke="var(--brand)"
      stroke-width="1.5"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
{/if}
