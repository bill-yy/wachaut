<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import QRCode from 'qrcode';
  import {
    getUsers, createUser, revokeUser, activateUser, changePassword, changeRole,
    totpSetup, totpEnable, totpDisable, MIN_PASSWORD_LENGTH,
    type AdminUserInfo,
  } from '$lib/admin';
  import { adminSession, updateSessionUser } from '$lib/admin-session.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import Input from '$lib/components/Input.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Pill from '$lib/components/Pill.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { copyText } from '$lib/utils/clipboard';
  import {
    UserPlus, ShieldCheck, User, KeyRound, Smartphone, RefreshCw, Copy, Check,
  } from 'lucide-svelte';

  const me = $derived(adminSession.user);
  const isSuperadmin = $derived(me?.role === 'superadmin');

  let users = $state<AdminUserInfo[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Generic confirmation (revoke / activate / role change)
  let confirmState = $state<{ title: string; message: string; danger?: boolean; action: () => Promise<void> } | null>(null);
  let confirmBusy = $state(false);

  // Create modal
  let showCreate = $state(false);
  let newUsername = $state('');
  let newPassword = $state('');
  let newRole = $state('admin');
  let creating = $state(false);

  // Password modal
  let showPassword = $state(false);
  let passwordUser = $state<AdminUserInfo | null>(null);
  let pwValue = $state('');
  let pwConfirm = $state('');
  let changingPw = $state(false);

  // Role modal
  let showRole = $state(false);
  let roleUser = $state<AdminUserInfo | null>(null);
  let roleValue = $state<'admin' | 'superadmin'>('admin');
  let changingRole = $state(false);

  // 2FA enable modal (steps: qr → verify → recovery codes)
  let showTotp = $state(false);
  let totpStep = $state<'qr' | 'verify' | 'codes'>('qr');
  let totpSecret = $state('');
  let totpUri = $state('');
  let totpQr = $state('');
  let totpCode = $state('');
  let totpBusy = $state(false);
  let recoveryCodes = $state<string[]>([]);
  let codesSaved = $state(false);

  // 2FA disable modal
  let showTotpOff = $state(false);
  let totpOffPassword = $state('');
  let totpOffCode = $state('');
  let totpOffBusy = $state(false);

  onMount(() => {
    if (!adminSession.token) { goto('/admin'); return; }
    void loadUsers();
  });

  async function loadUsers() {
    loading = true;
    loadError = '';
    try {
      const res = await getUsers();
      users = res.users;
    } catch (err: any) {
      if (err.message === 'Session expired') goto('/admin');
      else loadError = err?.message || 'Error al cargar usuarios';
    } finally {
      loading = false;
    }
  }

  async function runConfirm() {
    if (!confirmState) return;
    confirmBusy = true;
    try {
      await confirmState.action();
      confirmState = null;
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      confirmBusy = false;
    }
  }

  async function handleCreate() {
    if (!newUsername || !newPassword) return;
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }
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

  function openPassword(user: AdminUserInfo) {
    passwordUser = user;
    pwValue = '';
    pwConfirm = '';
    showPassword = true;
  }

  async function handleChangePw() {
    if (!passwordUser) return;
    if (pwValue.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }
    if (pwValue !== pwConfirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
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

  function askRevoke(user: AdminUserInfo) {
    confirmState = {
      title: 'Revocar acceso',
      message: `"${user.username}" no podrá iniciar sesión hasta que se reactive.`,
      danger: true,
      action: async () => {
        await revokeUser(user.id);
        toast.success(`Acceso revocado: ${user.username}`);
      },
    };
  }

  function askActivate(user: AdminUserInfo) {
    confirmState = {
      title: 'Reactivar acceso',
      message: `"${user.username}" volverá a poder iniciar sesión.`,
      action: async () => {
        await activateUser(user.id);
        toast.success(`Usuario activado: ${user.username}`);
      },
    };
  }

  function openRole(user: AdminUserInfo) {
    roleUser = user;
    roleValue = user.role === 'superadmin' ? 'superadmin' : 'admin';
    showRole = true;
  }

  function askRoleChange() {
    if (!roleUser || roleValue === roleUser.role) { showRole = false; return; }
    const target = roleUser;
    showRole = false;
    confirmState = {
      title: 'Cambiar rol',
      message: `"${target.username}" pasará a ser ${roleValue}.`,
      danger: roleValue === 'admin',
      action: async () => {
        await changeRole(target.id, roleValue);
        toast.success(`Rol de ${target.username}: ${roleValue}`);
      },
    };
  }

  // ── 2FA ─────────────────────────────────────────────────────────────

  async function openTotpSetup() {
    totpStep = 'qr';
    totpCode = '';
    recoveryCodes = [];
    codesSaved = false;
    totpBusy = true;
    showTotp = true;
    try {
      const res = await totpSetup();
      totpSecret = res.secret;
      totpUri = res.uri;
      totpQr = await QRCode.toDataURL(res.uri, { margin: 1, width: 220, color: { dark: '#000000', light: '#ffffff' } });
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar la configuración 2FA');
      showTotp = false;
    } finally {
      totpBusy = false;
    }
  }

  async function handleTotpVerify() {
    if (!/^\d{6}$/.test(totpCode)) {
      toast.error('Introduce el código de 6 dígitos');
      return;
    }
    totpBusy = true;
    try {
      const res = await totpEnable(totpCode);
      recoveryCodes = res.recoveryCodes;
      updateSessionUser({ totpEnabled: true });
      totpStep = 'codes';
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Código incorrecto');
    } finally {
      totpBusy = false;
    }
  }

  async function handleTotpDisable() {
    totpOffBusy = true;
    try {
      await totpDisable(totpOffPassword, totpOffCode || undefined);
      toast.success('2FA desactivado');
      updateSessionUser({ totpEnabled: false });
      showTotpOff = false;
      totpOffPassword = '';
      totpOffCode = '';
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    } finally {
      totpOffBusy = false;
    }
  }

  async function copyCodes() {
    const ok = await copyText(recoveryCodes.join('\n'));
    if (ok) {
      codesSaved = true;
      toast.success('Códigos copiados al portapapeles');
    } else {
      toast.warning('No se pudo copiar — cópialos manualmente');
    }
  }

  function formatDate(s: string | null): string {
    if (!s) return 'nunca';
    return new Date(s + 'Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<div class="mb-4 flex items-center justify-between gap-2">
  <h1 class="text-lg font-bold text-[var(--text)]">Usuarios administradores</h1>
  <div class="flex gap-2">
    <Button variant="ghost" size="sm" onclick={() => void loadUsers()} aria-label="Refrescar lista">
      <RefreshCw size={14} aria-hidden="true" />
    </Button>
    {#if isSuperadmin}
      <Button size="sm" onclick={() => (showCreate = true)}>
        <UserPlus size={16} aria-hidden="true" />
        Nuevo usuario
      </Button>
    {/if}
  </div>
</div>

{#if !me?.totpEnabled}
  <Card class="mb-4 flex flex-wrap items-center justify-between gap-3 border-[var(--warning)]/30 p-4">
    <div class="flex items-start gap-3">
      <Smartphone size={20} class="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
      <div>
        <p class="text-sm font-bold text-[var(--text)]">Tu cuenta no tiene 2FA activada</p>
        <p class="text-xs text-[var(--text-muted)]">Añade un segundo factor con tu app de autenticación (Google Authenticator, 1Password, Aegis…).</p>
      </div>
    </div>
    <Button variant="secondary" size="sm" onclick={() => void openTotpSetup()}>Activar 2FA</Button>
  </Card>
{/if}

{#if loading}
  <div class="space-y-2" aria-busy="true" aria-label="Cargando usuarios">
    {#each Array(3) as _, i (i)}
      <div class="h-[76px] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]"></div>
    {/each}
  </div>
{:else if loadError}
  <Card class="flex flex-col items-center gap-4 p-10 text-center">
    <p class="text-sm text-[var(--danger)]">{loadError}</p>
    <Button variant="secondary" onclick={() => void loadUsers()}>Reintentar</Button>
  </Card>
{:else if users.length === 0}
  <Card class="p-10 text-center text-sm text-[var(--text-muted)]">
    No hay usuarios administradores.
  </Card>
{:else}
  <div class="space-y-2">
    {#each users as user (user.id)}
      <Card class="flex flex-wrap items-center justify-between gap-3 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--brand)]">
            {#if user.role === 'superadmin'}
              <ShieldCheck size={20} aria-hidden="true" />
            {:else}
              <User size={20} aria-hidden="true" />
            {/if}
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-bold text-[var(--text)]">{user.username}</span>
              {#if me && user.id === me.id}
                <Badge tone="brand">Tú</Badge>
              {/if}
              {#if user.role === 'superadmin'}
                <Pill tone="brand">superadmin</Pill>
              {/if}
              {#if !user.active}
                <Pill tone="danger">revocado</Pill>
              {/if}
              {#if user.totp_enabled}
                <Badge tone="success">2FA</Badge>
              {/if}
              {#if user.must_change_password}
                <Badge tone="warning">rotación pendiente</Badge>
              {/if}
            </div>
            <p class="text-xs text-[var(--text-muted)]">
              Creado: {formatDate(user.created_at)} · Último login: {formatDate(user.last_login)}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          {#if me && user.id === me.id && me.totpEnabled}
            <Button variant="ghost" size="sm" onclick={() => (showTotpOff = true)}>
              <Smartphone size={14} aria-hidden="true" />
              <span class="hidden sm:inline">Quitar 2FA</span>
            </Button>
          {/if}
          <Button variant="ghost" size="sm" onclick={() => openPassword(user)}>
            <KeyRound size={14} aria-hidden="true" />
            <span class="hidden sm:inline">Contraseña</span>
          </Button>
          {#if isSuperadmin}
            <Button variant="ghost" size="sm" onclick={() => openRole(user)}>
              <ShieldCheck size={14} aria-hidden="true" />
              <span class="hidden sm:inline">Rol</span>
            </Button>
            {#if user.active}
              {#if !(me && user.id === me.id)}
                <Button variant="danger" size="sm" onclick={() => askRevoke(user)}>Revocar</Button>
              {/if}
            {:else}
              <Button variant="secondary" size="sm" onclick={() => askActivate(user)}>Activar</Button>
            {/if}
          {/if}
        </div>
      </Card>
    {/each}
  </div>
{/if}

<!-- Generic confirmation modal -->
<Modal open={!!confirmState} label="Confirmar acción" title={confirmState?.title} onClose={() => { if (!confirmBusy) confirmState = null; }}>
  {#if confirmState}
    <div class="space-y-4">
      <p class="text-sm leading-relaxed text-[var(--text-muted)]">{confirmState.message}</p>
      <div class="flex justify-end gap-2">
        <Button variant="ghost" onclick={() => (confirmState = null)} disabled={confirmBusy}>Cancelar</Button>
        <Button variant={confirmState.danger ? 'danger' : 'primary'} loading={confirmBusy} onclick={() => void runConfirm()}>
          Confirmar
        </Button>
      </div>
    </div>
  {/if}
</Modal>

<!-- Create user modal -->
<Modal open={showCreate} label="Crear usuario" title="Crear usuario admin" onClose={() => (showCreate = false)}>
  <div class="space-y-4">
    <Input label="Usuario" type="text" bind:value={newUsername} placeholder="ej: guillermo (3-32 caracteres)" />
    <Input
      label="Contraseña"
      type="password"
      autocomplete="new-password"
      bind:value={newPassword}
      placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
      hint="Se le pedirá cambiarla en su primer login si la cambias luego por aquí."
    />
    <div>
      <label for="new-role" class="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Rol</label>
      <select id="new-role" bind:value={newRole} class="input-field">
        <option value="admin">admin</option>
        <option value="superadmin">superadmin</option>
      </select>
    </div>
    <Button class="w-full justify-center" loading={creating} onclick={() => void handleCreate()} disabled={!newUsername || newPassword.length < MIN_PASSWORD_LENGTH}>
      Crear usuario
    </Button>
  </div>
</Modal>

<!-- Change password modal -->
<Modal open={showPassword} label="Cambiar contraseña" title="Cambiar contraseña" onClose={() => (showPassword = false)}>
  <div class="space-y-4">
    <p class="text-sm text-[var(--text-muted)]">
      Cambiando la contraseña de <span class="font-bold text-[var(--text)]">{passwordUser?.username}</span>.
      Sus sesiones activas se cerrarán.
    </p>
    <Input label="Nueva contraseña" type="password" autocomplete="new-password" bind:value={pwValue} placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`} />
    <Input
      label="Repite la contraseña"
      type="password"
      autocomplete="new-password"
      bind:value={pwConfirm}
      error={pwConfirm && pwValue !== pwConfirm ? 'Las contraseñas no coinciden' : ''}
    />
    <Button class="w-full justify-center" loading={changingPw} onclick={() => void handleChangePw()} disabled={pwValue.length < MIN_PASSWORD_LENGTH || pwValue !== pwConfirm}>
      Actualizar contraseña
    </Button>
  </div>
</Modal>

<!-- Change role modal -->
<Modal open={showRole} label="Cambiar rol" title={`Rol de ${roleUser?.username ?? ''}`} onClose={() => (showRole = false)}>
  <div class="space-y-4">
    <div>
      <label for="role-select" class="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Nuevo rol</label>
      <select id="role-select" bind:value={roleValue} class="input-field">
        <option value="admin">admin — acceso al panel</option>
        <option value="superadmin">superadmin — gestión de usuarios y mantenimiento</option>
      </select>
    </div>
    <Button class="w-full justify-center" variant="secondary" onclick={askRoleChange} disabled={changingRole || roleValue === roleUser?.role}>
      Aplicar cambio
    </Button>
  </div>
</Modal>

<!-- 2FA enable modal -->
<Modal
  open={showTotp}
  label="Activar 2FA"
  title="Activar doble factor (2FA)"
  onClose={() => { if (totpStep !== 'codes') showTotp = false; }}
>
  <div class="space-y-4">
    {#if totpStep === 'qr'}
      {#if totpBusy}
        <div class="flex justify-center py-8"><p class="text-sm text-[var(--text-muted)]">Generando…</p></div>
      {:else}
        <p class="text-sm text-[var(--text-muted)]">
          Escanea el código con tu app de autenticación (Google Authenticator, 1Password, Aegis…).
          El secreto se genera en tu navegador y nunca sale de tus servidores.
        </p>
        <div class="flex justify-center rounded-xl bg-white p-3">
          <img src={totpQr} alt="Código QR de configuración 2FA" width={200} height={200} />
        </div>
        <div>
          <p class="mb-1 text-xs text-[var(--text-muted)]">¿No puedes escanear? Introduce este secreto manualmente:</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 break-all rounded bg-[var(--surface-2)] px-2 py-1.5 text-xs text-[var(--brand)]">{totpSecret}</code>
            <Button variant="ghost" size="sm" onclick={() => void copyText(totpSecret).then((ok) => ok && toast.success('Secreto copiado'))} aria-label="Copiar secreto">
              <Copy size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
        <Button class="w-full justify-center" onclick={() => (totpStep = 'verify')}>Ya lo tengo — verificar</Button>
      {/if}
    {:else if totpStep === 'verify'}
      <p class="text-sm text-[var(--text-muted)]">Introduce el código de 6 dígitos que muestra la app para confirmar.</p>
      <Input label="Código de verificación" type="text" inputmode="numeric" autocomplete="one-time-code" bind:value={totpCode} placeholder="123456" />
      <Button class="w-full justify-center" loading={totpBusy} onclick={() => void handleTotpVerify()} disabled={!/^\d{6}$/.test(totpCode)}>
        Verificar y activar
      </Button>
    {:else}
      <div class="space-y-3">
        <p class="flex items-center gap-2 text-sm font-bold text-[var(--success)]">
          <Check size={16} aria-hidden="true" />
          2FA activada
        </p>
        <p class="text-sm text-[var(--text-muted)]">
          Guarda estos códigos de recuperación en un lugar seguro: cada uno sirve <strong>una vez</strong> para
          entrar si pierdes el teléfono. <strong>No volverán a mostrarse.</strong>
        </p>
        <div class="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--surface-2)] p-3 font-mono text-xs text-[var(--text)]">
          {#each recoveryCodes as code (code)}
            <span>{code}</span>
          {/each}
        </div>
        <div class="flex gap-2">
          <Button variant="secondary" class="flex-1 justify-center" onclick={() => void copyCodes()}>
            <Copy size={14} aria-hidden="true" />
            Copiar todos
          </Button>
          <Button class="flex-1 justify-center" onclick={() => (showTotp = false)} disabled={!codesSaved}>
            Los he guardado
          </Button>
        </div>
        {#if !codesSaved}
          <p class="text-center text-xs text-[var(--text-muted)]">Cópialos o anótalos antes de continuar.</p>
        {/if}
      </div>
    {/if}
  </div>
</Modal>

<!-- 2FA disable modal -->
<Modal open={showTotpOff} label="Desactivar 2FA" title="Quitar 2FA de tu cuenta" onClose={() => (showTotpOff = false)}>
  <div class="space-y-4">
    <p class="text-sm text-[var(--text-muted)]">
      Confirma con tu contraseña y un código actual (TOTP o de recuperación).
    </p>
    <Input label="Contraseña" type="password" autocomplete="current-password" bind:value={totpOffPassword} />
    <Input label="Código 2FA" type="text" inputmode="numeric" bind:value={totpOffCode} placeholder="123456" />
    <Button variant="danger" class="w-full justify-center" loading={totpOffBusy} onclick={() => void handleTotpDisable()} disabled={!totpOffPassword}>
      Desactivar 2FA
    </Button>
  </div>
</Modal>
