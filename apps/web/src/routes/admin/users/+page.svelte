<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    isLoggedIn, getUsers, createUser, revokeUser, activateUser, changePassword,
    type AdminUserInfo,
  } from '$lib/admin';
  import Brand from '$lib/components/Brand.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Pill from '$lib/components/Pill.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { ArrowLeft, UserPlus, ShieldCheck, ShieldOff, KeyRound } from 'lucide-svelte';

  let users = $state<AdminUserInfo[]>([]);
  let loading = $state(true);

  // Create user modal
  let showCreate = $state(false);
  let newUsername = $state('');
  let newPassword = $state('');
  let newRole = $state('admin');
  let creating = $state(false);

  // Change password modal
  let showPassword = $state(false);
  let passwordUser = $state<AdminUserInfo | null>(null);
  let pwValue = $state('');
  let changingPw = $state(false);

  onMount(async () => {
    if (!isLoggedIn()) { goto('/admin'); return; }
    await loadUsers();
  });

  async function loadUsers() {
    loading = true;
    try {
      const res = await getUsers();
      users = res.users;
    } catch (err: any) {
      if (err.message === 'Session expired') goto('/admin');
      else toast.error(err?.message || 'Error');
    } finally {
      loading = false;
    }
  }

  async function handleCreate() {
    if (!newUsername || !newPassword) return;
    creating = true;
    try {
      await createUser(newUsername, newPassword, newRole);
      toast.success(`Usuario "${newUsername}" creado`);
      showCreate = false;
      newUsername = ''; newPassword = ''; newRole = 'admin';
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear usuario');
    } finally {
      creating = false;
    }
  }

  async function handleRevoke(user: AdminUserInfo) {
    if (!confirm(`¿Revocar acceso a "${user.username}"?`)) return;
    try {
      await revokeUser(user.id);
      toast.success(`Acceso revocado: ${user.username}`);
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  }

  async function handleActivate(user: AdminUserInfo) {
    try {
      await activateUser(user.id);
      toast.success(`Usuario activado: ${user.username}`);
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  }

  function openPassword(user: AdminUserInfo) {
    passwordUser = user;
    pwValue = '';
    showPassword = true;
  }

  async function handleChangePw() {
    if (!passwordUser || !pwValue) return;
    changingPw = true;
    try {
      await changePassword(passwordUser.id, pwValue);
      toast.success('Contraseña actualizada');
      showPassword = false;
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      changingPw = false;
    }
  }

  function formatDate(s: string | null): string {
    if (!s) return 'nunca';
    return new Date(s + 'Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<div class="min-h-screen bg-[var(--bg)]">
  <header class="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-lg">
    <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
      <div class="flex items-center gap-3">
        <a href="/admin/dashboard" class="btn-ghost flex items-center gap-1.5 text-sm" aria-label="Volver al dashboard">
          <ArrowLeft size={16} />
        </a>
        <Brand size="sm" />
      </div>
      <button onclick={() => showCreate = true} class="btn-primary flex items-center gap-1.5 text-sm">
        <UserPlus size={16} />
        <span class="hidden sm:inline">Nuevo usuario</span>
      </button>
    </div>
  </header>

  <main class="mx-auto max-w-4xl px-4 py-6">
    <h1 class="mb-4 text-lg font-bold text-[var(--text)]">Usuarios administradores</h1>

    {#if loading}
      <p class="text-[var(--text-muted)]">Cargando…</p>
    {:else}
      <div class="space-y-2">
        {#each users as user}
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--brand)]">
                {#if user.role === 'superadmin'}
                  <ShieldCheck size={20} />
                {:else}
                  <ShieldOff size={20} />
                {/if}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-[var(--text)]">{user.username}</span>
                  {#if user.role === 'superadmin'}
                    <Pill tone="brand">superadmin</Pill>
                  {/if}
                  {#if !user.active}
                    <Pill tone="danger">revocado</Pill>
                  {/if}
                </div>
                <p class="text-xs text-[var(--text-muted)]">
                  Creado: {formatDate(user.created_at)} · Último login: {formatDate(user.last_login)}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick={() => openPassword(user)} class="btn-ghost flex items-center gap-1 text-xs" aria-label="Cambiar contraseña de {user.username}">
                <KeyRound size={14} />
                <span class="hidden sm:inline">Contraseña</span>
              </button>
              {#if user.active}
                <button onclick={() => handleRevoke(user)} class="btn-danger text-xs">Revocar</button>
              {:else}
                <button onclick={() => handleActivate(user)} class="btn-secondary text-xs">Activar</button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>

<!-- Create user modal -->
<Modal open={showCreate} label="Crear usuario" title="Crear usuario admin" onClose={() => showCreate = false}>
  <div class="space-y-4">
    <div>
      <label for="nu" class="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Usuario</label>
      <input id="nu" type="text" bind:value={newUsername} class="input-field" placeholder="ej: guillermo" />
    </div>
    <div>
      <label for="np" class="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Contraseña</label>
      <input id="np" type="password" bind:value={newPassword} class="input-field" placeholder="Mínimo 6 caracteres" />
    </div>
    <div>
      <label for="nr" class="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Rol</label>
      <select id="nr" bind:value={newRole} class="input-field">
        <option value="admin">admin</option>
        <option value="superadmin">superadmin</option>
      </select>
    </div>
    <button onclick={handleCreate} disabled={creating} class="btn-primary w-full justify-center">
      {creating ? 'Creando…' : 'Crear usuario'}
    </button>
  </div>
</Modal>

<!-- Change password modal -->
<Modal open={showPassword} label="Cambiar contraseña" title="Cambiar contraseña" onClose={() => showPassword = false}>
  <div class="space-y-4">
    <p class="text-sm text-[var(--text-muted)]">
      Cambiando contraseña de <span class="font-bold text-[var(--text)]">{passwordUser?.username}</span>
    </p>
    <div>
      <label for="cpw" class="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Nueva contraseña</label>
      <input id="cpw" type="password" bind:value={pwValue} class="input-field" placeholder="Mínimo 6 caracteres" />
    </div>
    <button onclick={handleChangePw} disabled={changingPw} class="btn-primary w-full justify-center">
      {changingPw ? 'Actualizando…' : 'Actualizar contraseña'}
    </button>
  </div>
</Modal>
