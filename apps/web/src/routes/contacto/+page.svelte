<script lang="ts">
	import { sendContact } from '$lib/feedback';
	import Brand from '$lib/components/Brand.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { Mailbox, Send, Check } from 'lucide-svelte';

  let name = $state('');
  let email = $state('');
  let message = $state('');
  let sending = $state(false);
  let sent = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (message.trim().length < 5) {
      toast.warning('Cuéntanos un poco más (mínimo 5 caracteres)');
      return;
    }
    sending = true;
    const res = await sendContact({ name, email, message: message.trim() });
    sending = false;
    if (res.ok) {
      sent = true;
      toast.success('Mensaje enviado — ¡gracias!');
    } else {
      toast.error(res.error || 'No se pudo enviar');
    }
  }
</script>

<svelte:head>
	<title>Contacto — Wachaut</title>
	<meta name="description" content="Escríbenos: ideas, problemas o propuestas. Tu mensaje llega directamente a nuestro equipo." />
	<link rel="canonical" href="https://wachaut.com/contacto" />
</svelte:head>

<div class="relative z-10 flex min-h-screen flex-col overflow-hidden">
  <nav class="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-5">
    <a href="/" aria-label="Volver al inicio"><Brand size="md" /></a>
    <a href="/" class="text-sm text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]">
      ← Inicio
    </a>
  </nav>

  <main class="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-16">
    <div class="mb-8 flex flex-col items-center gap-3 text-center">
      <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/12">
        <Mailbox class="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
      </span>
      <h1 class="text-2xl font-bold text-[var(--text)]">Contacta con nosotros</h1>
      <p class="max-w-md text-sm text-[var(--text-muted)]">
        Ideas, problemas, propuestas o simplemente dar las gracias — lo leemos todo.
        Tu mensaje llega directo a nuestro panel.
      </p>
    </div>

    {#if sent}
      <div class="glass mx-auto w-full max-w-lg rounded-2xl p-8 text-center">
        <span class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success)]/15">
          <Check class="h-6 w-6 text-[var(--success)]" aria-hidden="true" />
        </span>
        <h2 class="mb-2 text-lg font-bold text-[var(--text)]">Mensaje enviado</h2>
        <p class="mb-6 text-sm text-[var(--text-muted)]">
          Gracias por escribirnos. Si dejaste tu email, te contestaremos allí.
        </p>
        <a href="/" class="btn-secondary inline-flex items-center gap-2">← Volver al inicio</a>
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="glass mx-auto w-full max-w-lg space-y-4 rounded-2xl p-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre (opcional)" type="text" autocomplete="name" bind:value={name} placeholder="¿Cómo te llamas?" />
          <Input
            label="Email (opcional)"
            type="email"
            autocomplete="email"
            bind:value={email}
            placeholder="para poder responderte"
          />
        </div>
        <div>
          <label for="contact-message" class="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Mensaje</label>
          <textarea
            id="contact-message"
            bind:value={message}
            maxlength="2000"
            rows="5"
            required
            class="input-field resize-none text-sm"
            placeholder="Cuéntanos qué necesitas…"
          ></textarea>
        </div>
        <Button type="submit" loading={sending} class="w-full justify-center" disabled={message.trim().length < 5}>
          <Send size={16} aria-hidden="true" />
          Enviar mensaje
        </Button>
      </form>
    {/if}
  </main>
</div>
