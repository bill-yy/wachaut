<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { login, ApiError } from '$lib/admin';
  import { adminSession } from '$lib/admin-session.svelte';
  import Brand from '$lib/components/Brand.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let username = $state('');
  let password = $state('');
  let code = $state('');
  let needsCode = $state(false); // shown after a 401 with totpRequired
  let loading = $state(false);

  onMount(() => {
    if (adminSession.token) {
      goto(adminSession.user?.mustChangePassword ? '/admin/rotate' : '/admin/dashboard');
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!username || !password) return;
    if (needsCode && !code) return;
    loading = true;
    try {
      const { user } = await login(username, password, needsCode ? code : undefined);
      toast.success(`Bienvenido, ${user.username}`);
      goto(user.mustChangePassword ? '/admin/rotate' : '/admin/dashboard');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401 && err.data?.totpRequired) {
        needsCode = true;
        toast.warning('Introduce el código de tu app de autenticación (o un código de recuperación)');
      } else if (err instanceof ApiError && err.status === 429) {
        toast.error(err.message);
      } else {
        toast.error(err?.message || 'Error al iniciar sesión');
      }
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
      <Input label="Usuario" type="text" autocomplete="username" bind:value={username} placeholder="admin" required />
      <Input label="Contraseña" type="password" autocomplete="current-password" bind:value={password} placeholder="••••••••" required />
      {#if needsCode}
        <Input
          label="Código 2FA"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          bind:value={code}
          placeholder="123456"
          hint="Código de 6 dígitos de tu app, o un código de recuperación"
          required
        />
      {/if}
      <Button type="submit" loading={loading} class="w-full justify-center">Entrar</Button>
    </form>
  </div>
</div>
