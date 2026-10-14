<script lang="ts">
  /**
   * Forced password rotation. Accounts flagged must_change_password are
   * confined here by the middleware (and the admin layout) until they
   * rotate; the change also invalidates the token used to perform it, so
   * we bounce to the login with the fresh credentials.
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { changePassword, MIN_PASSWORD_LENGTH } from '$lib/admin';
  import { adminSession, clearSession } from '$lib/admin-session.svelte';
  import Brand from '$lib/components/Brand.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { ShieldAlert } from 'lucide-svelte';

  let password = $state('');
  let confirm = $state('');
  let loading = $state(false);
  let error = $state('');

  onMount(() => {
    if (!adminSession.token) goto('/admin');
  });

  const valid = $derived(
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirm
  );

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';
    if (password.length < MIN_PASSWORD_LENGTH) {
      error = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`;
      return;
    }
    if (password !== confirm) {
      error = 'Las contraseñas no coinciden';
      return;
    }
    if (!adminSession.user) return;
    loading = true;
    try {
      await changePassword(adminSession.user.id, password);
      toast.success('Contraseña actualizada — inicia sesión de nuevo');
      clearSession(); // the token died with the rotation; force a clean login
      goto('/admin');
    } catch (err: any) {
      error = err?.message || 'Error al cambiar la contraseña';
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
  <div class="w-full max-w-sm">
    <div class="mb-8 flex flex-col items-center gap-4">
      <Brand size="lg" />
      <p class="flex items-center gap-2 text-sm text-[var(--warning)]">
        <ShieldAlert size={16} aria-hidden="true" />
        Cambio de contraseña obligatorio
      </p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
      <p class="text-xs leading-relaxed text-[var(--text-muted)]">
        Tu contraseña inicial debe sustituirse por una nueva antes de acceder al panel.
        Al cambiarla se cerrarán todas las sesiones abiertas.
      </p>
      <Input
        label="Nueva contraseña"
        type="password"
        autocomplete="new-password"
        bind:value={password}
        placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
        required
      />
      <Input
        label="Repite la contraseña"
        type="password"
        autocomplete="new-password"
        bind:value={confirm}
        error={confirm && password !== confirm ? 'Las contraseñas no coinciden' : ''}
        required
      />
      {#if error}
        <p class="text-sm text-[var(--danger)]" role="alert">{error}</p>
      {/if}
      <Button type="submit" loading={loading} disabled={!valid} class="w-full justify-center">
        Guardar nueva contraseña
      </Button>
    </form>
  </div>
</div>
