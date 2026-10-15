<script lang="ts">
  /**
   * Post-broadcast rating: 1-5 stars + quick predefined questions for the
   * role (single-select chip rows) + optional comment. Used on the host
   * leave flow and the viewer "ended" screen.
   */
  import Button from '$lib/components/Button.svelte';
  import { sendFeedback } from '$lib/feedback';
  import { toast } from '$lib/stores/toast.svelte';
  import { Star } from 'lucide-svelte';

  interface Props {
    roomId: string;
    role: 'host' | 'viewer';
    /** Called after submit or skip — the caller proceeds (navigation etc). */
    onDone: () => void;
  }

  let { roomId, role, onDone }: Props = $props();

  const QUESTION_LABELS: Record<string, { question: string; options: { value: string; label: string }[] }> = {
    video: {
      question: '¿Cómo se vio el vídeo?',
      options: [
        { value: 'fluida', label: 'Fluida' },
        { value: 'cortes', label: 'Con algunos cortes' },
        { value: 'entrecortada', label: 'Muy entrecortada' },
      ],
    },
    entrada: {
      question: '¿Pudiste entrar bien?',
      options: [
        { value: 'sin_problemas', label: 'Sin problemas' },
        { value: 'tardo', label: 'Tardé en conectar' },
        { value: 'no_conecte', label: 'No conecté a la primera' },
      ],
    },
    recomendaria: {
      question: '¿Recomendarías Wachaut?',
      options: [
        { value: 'si', label: 'Sí' },
        { value: 'tal_vez', label: 'Tal vez' },
        { value: 'no', label: 'No' },
      ],
    },
    emision: {
      question: '¿Cómo fue emitir?',
      options: [
        { value: 'facil', label: 'Fácil' },
        { value: 'dificultades', label: 'Con dificultades' },
        { value: 'frustrante', label: 'Frustrante' },
      ],
    },
    estabilidad: {
      question: '¿Cómo fue tu conexión?',
      options: [
        { value: 'estable', label: 'Estable' },
        { value: 'algunos_cortes', label: 'Algunos cortes' },
        { value: 'cortes_constantes', label: 'Cortes constantes' },
      ],
    },
    volveria: {
      question: '¿Volverías a emitir?',
      options: [
        { value: 'si', label: 'Sí' },
        { value: 'tal_vez', label: 'Tal vez' },
        { value: 'no', label: 'No' },
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
      toast.warning('Elige de 1 a 5 estrellas');
      return;
    }
    sending = true;
    const ok = await sendFeedback({ roomId, role, rating, answers, comment: comment.trim() || undefined });
    sending = false;
    if (ok) toast.success('¡Gracias por tu valoración!');
    done = true;
    onDone();
  }

  function skip() {
    done = true;
    onDone();
  }
</script>

<div class="glass mx-auto w-full max-w-md rounded-2xl p-6 text-center" role="region" aria-label="Valoración de la retransmisión">
  {#if done}
    <p class="py-6 text-sm text-[var(--text-muted)]">¡Gracias por usar Wachaut!</p>
  {:else}
    <h3 class="mb-1 text-lg font-bold text-[var(--text)]">¿Qué tal fue la retransmisión?</h3>
    <p class="mb-4 text-xs text-[var(--text-muted)]">Tu respuesta es anónima y nos ayuda a mejorar (30 segundos).</p>

    <!-- Stars -->
    <div class="mb-5 flex justify-center gap-1" role="radiogroup" aria-label="Puntuación de 1 a 5 estrellas">
      {#each [1, 2, 3, 4, 5] as n (n)}
        <button
          type="button"
          onclick={() => (rating = n)}
          onmouseenter={() => (hovered = n)}
          onmouseleave={() => (hovered = 0)}
          class="rounded p-1 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          role="radio"
          aria-checked={rating === n}
          aria-label="{n} {n === 1 ? 'estrella' : 'estrellas'}"
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
          <p class="mb-1.5 text-xs font-medium text-[var(--text)]">{q.question}</p>
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
                {opt.label}
              </button>
            {/each}
          </div>
        </div>
      {/each}

      <div>
        <label for="rating-comment" class="mb-1.5 block text-xs font-medium text-[var(--text)]">¿Algo más? (opcional)</label>
        <textarea
          id="rating-comment"
          bind:value={comment}
          maxlength="500"
          rows="2"
          class="input-field resize-none text-sm"
          placeholder="Comentario libre…"
        ></textarea>
      </div>
    </div>

    <div class="mt-5 flex justify-center gap-2">
      <Button variant="ghost" onclick={skip}>Omitir</Button>
      <Button loading={sending} disabled={rating < 1} onclick={() => void submit()}>Enviar</Button>
    </div>
  {/if}
</div>
