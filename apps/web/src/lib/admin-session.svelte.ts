/**
 * Reactive admin session state (runes).
 *
 * The token lives in sessionStorage (cleared when the tab closes, never in
 * localStorage). This module mirrors it as reactive state so layouts and
 * pages can react to login/logout and to role/2FA flags.
 */

export interface AdminUserSession {
  id: number;
  username: string;
  role: string;
  totpEnabled: boolean;
  mustChangePassword: boolean;
}

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

function readUser(): AdminUserSession | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUserSession) : null;
  } catch {
    return null;
  }
}

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const adminSession = $state({
  token: typeof window === 'undefined' ? null : readToken(),
  user: typeof window === 'undefined' ? null : readUser(),
});

export function persistSession(token: string, user: AdminUserSession): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* private mode */ }
  adminSession.token = token;
  adminSession.user = user;
}

export function updateSessionUser(user: Partial<AdminUserSession>): void {
  if (!adminSession.user) return;
  adminSession.user = { ...adminSession.user, ...user };
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(adminSession.user));
  } catch { /* private mode */ }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch { /* private mode */ }
  adminSession.token = null;
  adminSession.user = null;
}
