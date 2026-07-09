<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { login, isLoggedIn } from '$lib/admin';
  import Brand from '$lib/components/Brand.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let username = $state('');
  let password = $state('');
  let loading = $state(false);

  onMount(() => {
    if (isLoggedIn()) goto('/admin/dashboard');
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!username || !password) return;
    loading = true;
    try {
      await login(username, password);
      toast.success('Bienvenido');
      goto('/admin/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar sesión');
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
  <div class="w-full max-w-sm">
    <div class="mb-8 flex flex-col items-center gap-4">
      <Brand size="lg" />
      <p class="text-sm text-[var(--text-muted)]">Panel de administración</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
      <div>
        <label for="username" class="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Usuario</label>
        <input
          id="username"
          type="text"
          autocomplete="username"
          bind:value={username}
          class="input-field"
          placeholder="admin"
          required
        />
      </div>
      <div>
        <label for="password" class="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Contraseña</label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
          bind:value={password}
          class="input-field"
          placeholder="••••••••"
          required
        />
      </div>
      <button type="submit" disabled={loading} class="btn-primary w-full justify-center">
        {#if loading}
          <Spinner size="sm" />
        {:else}
          Entrar
        {/if}
      </button>
    </form>
  </div>
</div>
