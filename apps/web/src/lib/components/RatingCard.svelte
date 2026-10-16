<script lang="ts">
  /**
   * Post-broadcast rating: 1-5 stars + quick predefined questions for the
   * role (single-select chip rows) + optional comment. Used on the host
   * leave flow and the viewer "ended" screen.
   */
  import Button from '$lib/components/Button.svelte';
  import { sendFeedback } from '$lib/feedback';
  import { t } from '$lib/i18n/index.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { Star } from 'lucide-svelte';

  interface Props {
    roomId: string;
    role: 'host' | 'viewer';
    /** Called after submit or skip — the caller proceeds (navigation etc). */
    onDone: () => void;
  }

  let { roomId, role, onDone }: Props = $props();

  // Question definitions: SFU enum value → dict key of the label.
  const QUESTION_LABELS: Record<string, { questionKey: string; options: { value: string; labelKey: string }[] }> = {
    video: {
      questionKey: 'rating.qVideo',
      options: [
        { value: 'fluida', labelKey: 'rating.qVideo1' },
        { value: 'cortes', labelKey: 'rating.qVideo2' },
        { value: 'entrecortada', labelKey: 'rating.qVideo3' },
      ],
    },
    entrada: {
      questionKey: 'rating.qEntry',
      options: [
        { value: 'sin_problemas', labelKey: 'rating.qEntry1' },
        { value: 'tardo', labelKey: 'rating.qEntry2' },
        { value: 'no_conecte', labelKey: 'rating.qEntry3' },
      ],
    },
    recomendaria: {
      questionKey: 'rating.qRecommend',
      options: [
        { value: 'si', labelKey: 'rating.yes' },
        { value: 'tal_vez', labelKey: 'rating.maybe' },
        { value: 'no', labelKey: 'rating.no' },
      ],
    },
    emision: {
      questionKey: 'rating.qBroadcast',
      options: [
        { value: 'facil', labelKey: 'rating.qBroadcast1' },
        { value: 'dificultades', labelKey: 'rating.qBroadcast2' },
        { value: 'frustrante', labelKey: 'rating.qBroadcast3' },
      ],
    },
    estabilidad: {
      questionKey: 'rating.qStability',
      options: [
        { value: 'estable', labelKey: 'rating.qStability1' },
        { value: 'algunos_cortes', labelKey: 'rating.qStability2' },
        { value: 'cortes_constantes', labelKey: 'rating.qStability3' },
      ],
    },
    volveria: {
      questionKey: 'rating.qReturn',
      options: [
        { value: 'si', labelKey: 'rating.yes' },
        { value: 'tal_vez', labelKey: 'rating.maybe' },
        { value: 'no', labelKey: 'rating.no' },
      ],
    },
  };

  const questions = $derived(
    (role === 'host' ? ['emision', 'estabilidad', 'volveria'] : ['video', 'entrada', 'recomendaria'])
      .map((key) => ({ key, ...QUESTION_LABELS[key] }))
  );

  let rating = $state(0);
  let hovered = $state(0);
  let answers = $state<Record<string, string>>({});
  let comment = $state('');
  let sending = $state(false);
  let done = $state(false);

  function selectAnswer(key: string, value: string) {
    // Single-select chip: tapping the selected chip clears it.
    if (answers[key] === value) {
      const next = { ...answers };
      delete next[key];
      answers = next;
    } else {
      answers = { ...answers, [key]: value };
    }
  }

  async function submit() {
    if (rating < 1) {
      toast.warning(t('rating.pickStars'));
      return;
    }
    sending = true;
    const ok = await sendFeedback({ roomId, role, rating, answers, comment: comment.trim() || undefined });
    sending = false;
    if (ok) toast.success(t('rating.thanks'));
    done = true;
    onDone();
  }

  function skip() {
    done = true;
    onDone();
  }
</script>

<div class="glass mx-auto w-full max-w-md rounded-2xl p-6 text-center" role="region" aria-label={t('rating.ariaRegion')}>
  {#if done}
    <p class="py-6 text-sm text-[var(--text-muted)]">{t('rating.thanksBody')}</p>
  {:else}
    <h3 class="mb-1 text-lg font-bold text-[var(--text)]">{t('rating.title')}</h3>
    <p class="mb-4 text-xs text-[var(--text-muted)]">{t('rating.subtitle')}</p>

    <!-- Stars -->
    <div class="mb-5 flex justify-center gap-1" role="radiogroup" aria-label={t('rating.ariaStars')}>
      {#each [1, 2, 3, 4, 5] as n (n)}
        <button
          type="button"
          onclick={() => (rating = n)}
          onmouseenter={() => (hovered = n)}
          onmouseleave={() => (hovered = 0)}
          class="rounded p-1 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          role="radio"
          aria-checked={rating === n}
          aria-label="{n} {n === 1 ? t('rating.starLabel') : t('rating.starsLabel')}"
        >
          <Star
            size={28}
            class="transition-colors {(hovered || rating) >= n ? 'fill-[var(--brand)] text-[var(--brand)]' : 'text-[var(--text-subtle)]'}"
            aria-hidden="true"
          />
        </button>
      {/each}
    </div>

    <!-- Quick questions -->
    <div class="space-y-3 text-left">
      {#each questions as q (q.key)}
        <div>
          <p class="mb-1.5 text-xs font-medium text-[var(--text)]">{t(q.questionKey as any)}</p>
          <div class="flex flex-wrap gap-1.5">
            {#each q.options as opt (opt.value)}
              <button
                type="button"
                onclick={() => selectAnswer(q.key, opt.value)}
                class="rounded-full border px-3 py-1 text-xs transition-colors {answers[q.key] === opt.value
                  ? 'border-[var(--brand)] bg-[var(--brand)]/15 text-[var(--brand)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--brand)]/40'}"
                aria-pressed={answers[q.key] === opt.value}
              >
                {t(opt.labelKey as any)}
              </button>
            {/each}
          </div>
        </div>
      {/each}

      <div>
        <label for="rating-comment" class="mb-1.5 block text-xs font-medium text-[var(--text)]">{t('rating.comment')}</label>
        <textarea
          id="rating-comment"
          bind:value={comment}
          maxlength="500"
          rows="2"
          class="input-field resize-none text-sm"
          placeholder={t('rating.commentPlaceholder')}
        ></textarea>
      </div>
    </div>

    <div class="mt-5 flex justify-center gap-2">
      <Button variant="ghost" onclick={skip}>{t('rating.skip')}</Button>
      <Button loading={sending} disabled={rating < 1} onclick={() => void submit()}>{t('rating.submit')}</Button>
    </div>
  {/if}
</div>
