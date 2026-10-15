<script lang="ts">
  /**
   * Contact messages (from /contacto) + post-broadcast feedback with the
   * key-question distributions.
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    getContact, markContactRead, deleteContactMessage, getFeedback, deleteFeedback,
    type AdminContactPage, type AdminFeedback,
  } from '$lib/admin';
  import { adminSession } from '$lib/admin-session.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import Star from '$lib/components/Stars.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { Mail, Star as StarIcon, RefreshCw, Trash2, MailOpen, Mail as MailUnread, ChevronLeft, ChevronRight } from 'lucide-svelte';

  let contact = $state<AdminContactPage | null>(null);
  let feedback = $state<AdminFeedback | null>(null);
  let loading = $state(true);
  let loadError = $state('');
  let contactOffset = $state(0);
  const CONTACT_PAGE = 20;

  let days = $state<7 | 30>(7);
  let refreshing = $state(false);

  let confirmDelete = $state<number | null>(null);
  let confirmDeleteFeedback = $state<number | null>(null);
  let deleteBusy = $state(false);

  onMount(() => {
    if (!adminSession.token) { goto('/admin'); return; }
    void load();
  });

  async function load(offset = contactOffset) {
    loading = true;
    loadError = '';
    try {
      const [c, f] = await Promise.all([
        getContact(CONTACT_PAGE, offset),
        getFeedback(days),
      ]);
      contact = c;
      contactOffset = offset;
      feedback = f;
    } catch (err: any) {
      if (err.message === 'Session expired') goto('/admin');
      else loadError = err?.message || 'Error al cargar';
    } finally {
      loading = false;
    }
  }

  async function refreshFeedback() {
    refreshing = true;
    try {
      feedback = await getFeedback(days);
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      refreshing = false;
    }
  }

  function setDays(d: 7 | 30) {
    if (days === d) return;
    days = d;
    void refreshFeedback();
  }

  async function toggleRead(id: number, read: boolean) {
    try {
      await markContactRead(id, read);
      if (contact) {
        const msg = contact.messages.find((m) => m.id === id);
        if (msg) msg.read = read ? 1 : 0;
        contact.unread += read ? -1 : 1;
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  }

  async function runDelete() {
    if (confirmDelete == null) return;
    deleteBusy = true;
    try {
      await deleteContactMessage(confirmDelete);
      toast.success('Mensaje eliminado');
      confirmDelete = null;
      await load(0);
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      deleteBusy = false;
    }
  }

  async function runDeleteFeedback() {
    if (confirmDeleteFeedback == null) return;
    deleteBusy = true;
    try {
      await deleteFeedback(confirmDeleteFeedback);
      toast.success('Valoración eliminada');
      confirmDeleteFeedback = null;
      await refreshFeedback();
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

  const ANSWER_LABELS: Record<string, string> = {
    fluida: 'Fluida', cortes: 'Con algunos cortes', entrecortada: 'Muy entrecortada',
    sin_problemas: 'Sin problemas', tardo: 'Tardó en conectar', no_conecte: 'No conectó a la primera',
    recomendaria: '¿Recomendaría?', emision: 'Experiencia emitiendo',
    facil: 'Fácil', dificultades: 'Con dificultades', frustrante: 'Frustrante',
    estabilidad: 'Estabilidad', estable: 'Estable', algunos_cortes: 'Algunos cortes', cortes_constantes: 'Cortes constantes',
    volveria: '¿Volvería?',
    si: 'Sí', tal_vez: 'Tal vez', no: 'No',
  };

  function label(v: string): string {
    return ANSWER_LABELS[v] || v;
  }

  const maxDist = $derived(feedback ? Math.max(...feedback.distribution, 1) : 1);
</script>

<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
  <h1 class="text-lg font-bold text-[var(--text)]">Contacto y valoraciones</h1>
  <Button variant="ghost" size="sm" onclick={() => void load()} aria-label="Refrescar">
    <RefreshCw size={14} aria-hidden="true" />
  </Button>
</div>

{#if loading}
  <div class="flex h-64 items-center justify-center gap-2 text-[var(--text-muted)]">
    <Spinner size="md" /> Cargando…
  </div>
{:else if loadError}
  <Card class="flex flex-col items-center gap-4 p-10 text-center">
    <p class="text-sm text-[var(--danger)]">{loadError}</p>
    <Button variant="secondary" onclick={() => void load()}>Reintentar</Button>
  </Card>
{:else}
  <!-- ═══ Mensajes ═══ -->
  <h2 class="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
    <Mail size={16} aria-hidden="true" />
    Mensajes de contacto
    {#if contact && contact.unread > 0}
      <Badge tone="brand">{contact.unread} sin leer</Badge>
    {/if}
  </h2>

  {#if !contact || contact.messages.length === 0}
    <Card class="p-8 text-center text-sm text-[var(--text-muted)]">Todavía no hay mensajes.</Card>
  {:else}
    <div class="space-y-2">
      {#each contact.messages as m (m.id)}
        <Card class="p-4 {m.read ? 'opacity-70' : ''}">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                {#if !m.read}
                  <Badge tone="brand">nuevo</Badge>
                {/if}
                <span class="font-bold text-[var(--text)]">{m.name || 'Anónimo'}</span>
                {#if m.email}
                  <a href="mailto:{m.email}" class="text-[var(--brand)] hover:underline">{m.email}</a>
                {/if}
                {#if m.country}
                  <Badge>{m.country}</Badge>
                {/if}
                <span class="text-[var(--text-subtle)]">{formatAgo(m.ts)}</span>
              </div>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--text-muted)]">{m.message}</p>
            </div>
            <div class="flex shrink-0 gap-1">
              <Button variant="ghost" size="sm" onclick={() => void toggleRead(m.id, !m.read)} aria-label={m.read ? 'Marcar como no leído' : 'Marcar como leído'}>
                {#if m.read}
                  <MailUnread size={14} aria-hidden="true" />
                {:else}
                  <MailOpen size={14} aria-hidden="true" />
                {/if}
              </Button>
              <Button variant="ghost" size="sm" onclick={() => (confirmDelete = m.id)} aria-label="Eliminar mensaje">
                <Trash2 size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>

    {#if contact.total > CONTACT_PAGE}
      <div class="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{contactOffset + 1}–{Math.min(contactOffset + CONTACT_PAGE, contact.total)} de {contact.total}</span>
        <div class="flex gap-1">
          <Button variant="ghost" size="sm" disabled={contactOffset === 0} onclick={() => void load(Math.max(0, contactOffset - CONTACT_PAGE))} aria-label="Página anterior">
            <ChevronLeft size={14} aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" disabled={contactOffset + CONTACT_PAGE >= contact.total} onclick={() => void load(contactOffset + CONTACT_PAGE)} aria-label="Página siguiente">
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    {/if}
  {/if}

  <!-- ═══ Valoraciones ═══ -->
  <div class="mb-3 mt-8 flex flex-wrap items-center justify-between gap-2">
    <h2 class="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
      <StarIcon size={16} aria-hidden="true" />
      Valoraciones de retransmisiones
    </h2>
    <div class="flex overflow-hidden rounded-lg border border-[var(--border)]" role="group" aria-label="Rango">
      <button onclick={() => setDays(7)} class="px-3 py-1.5 text-xs {days === 7 ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'text-[var(--text-muted)]'}" aria-pressed={days === 7}>7 días</button>
      <button onclick={() => setDays(30)} class="px-3 py-1.5 text-xs {days === 30 ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'text-[var(--text-muted)]'}" aria-pressed={days === 30}>30 días</button>
    </div>
  </div>

  {#if !feedback || feedback.count === 0}
    <Card class="p-8 text-center text-sm text-[var(--text-muted)]">
      Sin valoraciones todavía — se pedirá al terminar cada retransmisión.
    </Card>
  {:else}
    <!-- KPIs -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card class="flex flex-col items-center justify-center p-4">
        <Star value={feedback.average ?? 0} />
        <p class="mt-1 text-xs text-[var(--text-muted)]">media ({feedback.count} valoraciones)</p>
      </Card>
      <Card class="p-4">
        <p class="text-xs font-medium text-[var(--text-muted)]">Hosts</p>
        <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{feedback.roles.host}</p>
      </Card>
      <Card class="p-4">
        <p class="text-xs font-medium text-[var(--text-muted)]">Viewers</p>
        <p class="mt-2 text-2xl font-bold text-[var(--brand)]">{feedback.roles.viewer}</p>
      </Card>
      <Card class="p-4">
        <p class="text-xs font-medium text-[var(--text-muted)]">5 estrellas</p>
        <p class="mt-2 text-2xl font-bold text-[var(--success)]">{Math.round((feedback.distribution[4] / feedback.count) * 100)}%</p>
      </Card>
    </div>

    <!-- Distribution -->
    <Card class="mt-4 p-4">
      <h3 class="mb-3 text-sm font-bold text-[var(--text)]">Distribución de estrellas</h3>
      <div class="space-y-1.5">
        {#each feedback.distribution as count, i (i)}
          <div class="flex items-center gap-2 text-xs">
            <span class="w-10 text-[var(--text-muted)]">{i + 1} ★</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg)]">
              <div class="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]" style="width: {(count / maxDist) * 100}%"></div>
            </div>
            <span class="w-8 text-right text-[var(--text-muted)]">{count}</span>
          </div>
        {/each}
      </div>
    </Card>

    <!-- Question distributions per role -->
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      {#each [['viewer', 'Viewers'], ['host', 'Hosts']] as [roleKey, roleLabel]}
        {#if feedback.questions[roleKey as 'viewer' | 'host'].length > 0 && feedback.roles[roleKey as 'viewer' | 'host'] > 0}
          <Card class="p-4">
            <h3 class="mb-3 text-sm font-bold text-[var(--text)]">Preguntas clave · {roleLabel}</h3>
            <div class="space-y-4">
              {#each feedback.questions[roleKey as 'viewer' | 'host'] as q (q.question)}
                <div>
                  <p class="mb-1.5 text-xs font-medium text-[var(--text-muted)]">{q.question}</p>
                  <div class="space-y-1">
                    {#each q.options as opt (opt.value)}
                      <div class="flex items-center gap-2 text-xs">
                        <span class="w-36 truncate text-[var(--text)]" title={label(opt.value)}>{label(opt.value)}</span>
                        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg)]">
                          <div class="h-full rounded-full bg-[var(--brand)]/70" style="width: {feedback.count ? (opt.count / feedback.count) * 100 : 0}%"></div>
                        </div>
                        <span class="w-6 text-right text-[var(--text-muted)]">{opt.count}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </Card>
        {/if}
      {/each}
    </div>

    <!-- Recent with comments -->
    <Card class="mt-4 p-4">
      <h3 class="mb-3 text-sm font-bold text-[var(--text)]">Últimas valoraciones</h3>
      <div class="max-h-72 space-y-1.5 overflow-y-auto">
        {#each feedback.recent as r (r.id)}
          <div class="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[var(--brand)]">{'★'.repeat(r.rating)}<span class="text-[var(--text-subtle)]">{'★'.repeat(5 - r.rating)}</span></span>
                <Badge tone={r.role === 'host' ? 'brand' : 'neutral'}>{r.role}</Badge>
                <code class="text-[var(--text-subtle)]">{r.room_id ? r.room_id.slice(0, 8) + '…' : '—'}</code>
                <span class="text-[var(--text-subtle)]">{formatAgo(r.ts)}</span>
              </div>
              {#if r.comment}
                <p class="mt-1 break-words text-[var(--text-muted)]">“{r.comment}”</p>
              {/if}
              {#if r.answers && Object.keys(JSON.parse(r.answers || '{}')).length > 0}
                <p class="mt-1 flex flex-wrap gap-1">
                  {#each Object.entries(JSON.parse(r.answers || '{}')) as [key, value] (key)}
                    <span class="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[0.6rem] text-[var(--text-muted)]">{label(String(value))}</span>
                  {/each}
                </p>
              {/if}
            </div>
            <Button variant="ghost" size="sm" onclick={() => (confirmDeleteFeedback = r.id)} aria-label="Eliminar valoración">
              <Trash2 size={14} aria-hidden="true" />
            </Button>
          </div>
        {/each}
      </div>
    </Card>
  {/if}
{/if}

<!-- Delete confirmations -->
<Modal open={confirmDelete != null} label="Eliminar mensaje" title="Eliminar mensaje" onClose={() => { if (!deleteBusy) confirmDelete = null; }}>
  <div class="space-y-4">
    <p class="text-sm text-[var(--text-muted)]">El mensaje se eliminará permanentemente. ¿Seguro?</p>
    <div class="flex justify-end gap-2">
      <Button variant="ghost" onclick={() => (confirmDelete = null)} disabled={deleteBusy}>Cancelar</Button>
      <Button variant="danger" loading={deleteBusy} onclick={() => void runDelete()}>Eliminar</Button>
    </div>
  </div>
</Modal>

<Modal open={confirmDeleteFeedback != null} label="Eliminar valoración" title="Eliminar valoración" onClose={() => { if (!deleteBusy) confirmDeleteFeedback = null; }}>
  <div class="space-y-4">
    <p class="text-sm text-[var(--text-muted)]">
      La valoración se eliminará permanentemente y dejará de contar en las medias. ¿Seguro?
    </p>
    <div class="flex justify-end gap-2">
      <Button variant="ghost" onclick={() => (confirmDeleteFeedback = null)} disabled={deleteBusy}>Cancelar</Button>
      <Button variant="danger" loading={deleteBusy} onclick={() => void runDeleteFeedback()}>Eliminar</Button>
    </div>
  </div>
</Modal>
