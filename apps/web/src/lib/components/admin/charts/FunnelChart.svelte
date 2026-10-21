<script lang="ts">
  /**
   * Product funnel: horizontal steps with absolute width relative to the
   * first step and step-to-step conversion rates.
   */
  interface Step {
    label: string;
    value: number;
    hint?: string;
  }

  let { steps }: { steps: Step[] } = $props();

  const first = $derived(steps[0]?.value ?? 0);
  const pctOfFirst = (v: number) => (first > 0 ? Math.max(2, (v / first) * 100) : 0);
</script>

<div class="space-y-2">
  {#each steps as step, i (step.label)}
    {@const conv = i > 0 && steps[i - 1].value > 0 ? Math.round((step.value / steps[i - 1].value) * 100) : null}
    <div>
      {#if conv !== null}
        <p class="mb-0.5 flex items-center gap-1 text-[0.65rem] text-[var(--text-subtle)]">
          <span aria-hidden="true">↓</span>
          {conv}% desde el paso anterior
        </p>
      {/if}
      <div class="flex items-center gap-3">
        <span class="w-40 shrink-0 text-xs text-[var(--text-muted)]" title={step.label}>{step.label}</span>
        <div class="h-7 flex-1 overflow-hidden rounded-lg bg-[var(--bg)]">
          <div
            class="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-[var(--brand)]/70 to-[var(--accent)] px-2 transition-[width] duration-[var(--duration-slow)]"
            style="width: {pctOfFirst(step.value)}%"
          >
            <span class="font-mono text-xs font-bold text-[var(--brand-fg)]">{step.value}</span>
          </div>
        </div>
        {#if step.hint}
          <span class="w-28 shrink-0 text-right text-[0.65rem] text-[var(--text-subtle)]">{step.hint}</span>
        {/if}
      </div>
    </div>
  {/each}
</div>
