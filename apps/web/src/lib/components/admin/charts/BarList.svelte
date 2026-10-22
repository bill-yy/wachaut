<script lang="ts">
  /**
   * Ranked horizontal-bar list. Rows are optionally clickable to apply a
   * cross-dimension filter (the active filter row is highlighted).
   */
  import { cn } from '$lib/utils/cn';

  interface Item {
    label: string;
    value: number;
    sub?: string;
  }

  let {
    items,
    emptyText = 'Sin datos aún',
    activeLabel,
    onSelect,
  }: {
    items: Item[];
    emptyText?: string;
    /** Highlight + aria-pressed for the row currently used as a filter. */
    activeLabel?: string;
    /** When provided, rows become filter buttons. */
    onSelect?: (label: string) => void;
  } = $props();

  const max = $derived(Math.max(1, ...items.map((i) => i.value)));
</script>

{#if items.length === 0}
  <p class="py-4 text-center text-sm text-[var(--text-muted)]">{emptyText}</p>
{:else}
  <div class="max-h-64 space-y-1 overflow-y-auto">
    {#each items as item (item.label)}
      <div class={cn('group rounded-lg', onSelect && 'cursor-pointer hover:bg-[var(--surface-2)]', activeLabel === item.label && 'bg-[var(--brand)]/10')}>
        <button
          type="button"
          class="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs disabled:cursor-default"
          onclick={() => onSelect?.(item.label)}
          disabled={!onSelect}
          aria-pressed={onSelect ? activeLabel === item.label : undefined}
        >
          <span class="w-32 shrink-0 truncate text-[var(--text)]" title={item.label}>{item.label}</span>
          <span class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg)]">
            <span
              class="block h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] transition-[width] duration-[var(--duration-base)]"
              style="width: {(item.value / max) * 100}%"
            ></span>
          </span>
          <span class="w-10 shrink-0 text-right font-mono text-[var(--text)]">{item.value}</span>
          {#if item.sub}
            <span class="w-16 shrink-0 truncate text-right text-[var(--text-subtle)]" title={item.sub}>{item.sub}</span>
          {/if}
        </button>
      </div>
    {/each}
  </div>
{/if}
