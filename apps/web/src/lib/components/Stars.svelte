<script lang="ts">
  /** Read-only star display (e.g. "4.2" average) for the admin panel. */
  import { Star } from 'lucide-svelte';

  let { value = 0, size = 20 }: { value?: number; size?: number } = $props();

  // Round to halves so the display doesn't flicker between updates.
  const rounded = $derived(Math.round(value * 2) / 2);
</script>

<div class="flex items-center gap-2" role="img" aria-label="Valoración media: {value} de 5">
  <div class="flex gap-0.5">
    {#each [1, 2, 3, 4, 5] as n (n)}
      <div class="relative">
        <Star {size} class="text-[var(--text-subtle)]" aria-hidden="true" />
        {#if rounded >= n}
          <div class="absolute inset-0">
            <Star {size} class="fill-[var(--brand)] text-[var(--brand)]" aria-hidden="true" />
          </div>
        {:else if rounded === n - 0.5}
          <div class="absolute inset-0 overflow-hidden" style="width: 50%">
            <Star {size} class="fill-[var(--brand)] text-[var(--brand)]" aria-hidden="true" />
          </div>
        {/if}
      </div>
    {/each}
  </div>
  <span class="text-lg font-bold text-[var(--brand)]">{value || '—'}</span>
</div>
