<script lang="ts">
  /**
   * Shared admin shell: session guard + header with navigation, current
   * user/role and logout. The login page (/admin) and the forced-rotation
   * page (/admin/rotate) render bare (no header, no guard).
   */
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page as pageState } from '$app/state';
  import { adminSession, clearSession } from '$lib/admin-session.svelte';
  import { logout } from '$lib/admin';
  import Brand from '$lib/components/Brand.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { LayoutDashboard, Users, LogOut, ShieldAlert } from 'lucide-svelte';

  let { children }: { children: Snippet } = $props();

  // $app/state exposes url as a reactive object.
  const pathname = $derived(pageState.url.pathname);
  const isBareRoute = $derived(pathname === '/admin' || pathname === '/admin/rotate');
  const needsRotation = $derived(!!adminSession.user?.mustChangePassword);

  onMount(() => {
    // Guard: protected admin pages require a session…
    if (!isBareRoute && !adminSession.token) {
      goto('/admin');
    }
    // …and an account flagged for rotation is confined to /admin/rotate.
    if (needsRotation && pathname !== '/admin/rotate' && pathname !== '/admin') {
      goto('/admin/rotate');
    }
  });

  async function handleLogout() {
    await logout();
    goto('/admin');
  }
</script>

{#if !isBareRoute}
  <div class="min-h-screen bg-[var(--bg)]">
    <header class="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-lg">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <div class="flex items-center gap-3">
          <Brand size="sm" />
          <nav class="flex items-center gap-1" aria-label="Navegación del panel">
            <a
              href="/admin/dashboard"
              class="btn-ghost flex items-center gap-1.5 text-sm"
              aria-current={pathname.startsWith('/admin/dashboard') ? 'page' : undefined}
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              <span class="hidden sm:inline">Dashboard</span>
            </a>
            <a
              href="/admin/users"
              class="btn-ghost flex items-center gap-1.5 text-sm"
              aria-current={pathname.startsWith('/admin/users') ? 'page' : undefined}
            >
              <Users size={16} aria-hidden="true" />
              <span class="hidden sm:inline">Usuarios</span>
            </a>
          </nav>
        </div>
        <div class="flex items-center gap-2">
          {#if adminSession.user}
            <span class="hidden text-xs text-[var(--text-muted)] md:inline">{adminSession.user.username}</span>
            {#if adminSession.user.role === 'superadmin'}
              <Badge tone="brand">superadmin</Badge>
            {:else}
              <Badge>admin</Badge>
            {/if}
            {#if adminSession.user.totpEnabled}
              <Badge tone="success" class="hidden sm:inline-flex">2FA</Badge>
            {/if}
          {/if}
          <button onclick={handleLogout} class="btn-ghost flex items-center gap-1.5 text-sm" aria-label="Cerrar sesión">
            <LogOut size={16} aria-hidden="true" />
            <span class="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>

    {#if needsRotation}
      <div class="border-b border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-2 text-center text-xs text-[var(--warning)]">
        <ShieldAlert size={14} class="mr-1 inline align-[-2px]" aria-hidden="true" />
        Debes cambiar tu contraseña antes de continuar.
      </div>
    {/if}

    <main class="mx-auto max-w-6xl px-4 py-6">
      {@render children()}
    </main>
  </div>
{:else}
  {@render children()}
{/if}
