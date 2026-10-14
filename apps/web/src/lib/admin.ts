/**
 * Admin API client — handles JWT auth and all /api/admin/* requests.
 * The API base URL is the same origin (wadmin.*) since the Fastify server
 * is fronted by Traefik on the same subdomain.
 *
 * Errors surface as ApiError with `status` and `data`, so pages can branch
 * on structured payloads (e.g. login 401 with totpRequired).
 */

import { adminSession, persistSession, clearSession, type AdminUserSession } from './admin-session.svelte';

const API_BASE = '/api/admin';
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getToken(): string | null {
  return adminSession.token;
}

async function request<T>(path: string, options: RequestInit & { auth401?: 'clear' | 'pass' } = {}): Promise<T> {
  const { auth401 = 'clear', ...init } = options;
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status === 401 && auth401 === 'clear') {
    clearSession();
    throw new ApiError('Session expired', 401, {});
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new ApiError(data.error || `HTTP ${res.status}`, res.status, data);
  }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string,
  code?: string
): Promise<{ user: AdminUserSession }> {
  try {
    const data = await request<{ token: string; user: AdminUserSession }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, ...(code ? { code } : {}) }),
      auth401: 'pass',
    });
    persistSession(data.token, data.user);
    return data;
  } catch (err) {
    // 401 on login = bad credentials (or missing 2FA code) — rethrow as-is
    // so the login page can inspect err.data.totpRequired.
    throw err;
  }
}

/** Server-side audit + local wipe. Never throws (best effort). */
export async function logout(): Promise<void> {
  try {
    await request('/logout', { method: 'POST' });
  } catch { /* the session is being dropped anyway */ }
  clearSession();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ── Metrics ──────────────────────────────────────────────────────────

export interface AdminMetrics {
  rooms: number;
  viewers: number;
  connections: number;
  sfu: { status: string; workers: number; rooms: number; totalPeers: number } | null;
  maintenance: boolean;
  uptime: number;
  memory: number;
}

export function getMetrics(): Promise<AdminMetrics> {
  return request<AdminMetrics>('/metrics');
}

// ── Rooms + moderation ───────────────────────────────────────────────

export interface AdminRoom {
  id: string;
  hostId: string;
  createdAt: string;
  viewerCount: number;
  isSharing: boolean;
  isMuted: boolean;
  chatMessages: number;
  viewers: { name: string; joinedAt: number; connected: boolean }[];
}

export function getRooms(): Promise<{ rooms: AdminRoom[] }> {
  return request<{ rooms: AdminRoom[] }>('/rooms');
}

export function closeRoom(roomId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/rooms/${encodeURIComponent(roomId)}/close`, { method: 'POST' });
}

export function kickViewer(roomId: string, viewer: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/rooms/${encodeURIComponent(roomId)}/kick`, {
    method: 'POST',
    body: JSON.stringify({ viewer }),
  });
}

// ── Stats ────────────────────────────────────────────────────────────

export interface AdminStats {
  traffic: { date: string; total_rooms: number; peak_viewers: number; total_viewers: number; countries: string }[];
  countries: { country: string; count: number }[];
  totalRoomsCreated: number;
}

export function getStats(): Promise<AdminStats> {
  return request<AdminStats>('/stats');
}

// ── Security + audit ─────────────────────────────────────────────────

export interface AdminSecurity {
  ips: { ip: string; connections: number; country: string }[];
  auditLog: { username: string; action: string; ip: string; country: string; timestamp: string }[];
}

export function getSecurity(): Promise<AdminSecurity> {
  return request<AdminSecurity>('/security');
}

export interface AuditPage {
  total: number;
  entries: { username: string; action: string; ip: string; country: string; timestamp: string }[];
}

export function getAudit(limit = 25, offset = 0, action?: string): Promise<AuditPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (action) params.set('action', action);
  return request<AuditPage>(`/audit?${params.toString()}`);
}

// ── Maintenance ──────────────────────────────────────────────────────

export function setMaintenance(enabled: boolean): Promise<{ maintenance: boolean }> {
  return request<{ maintenance: boolean }>('/maintenance', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

// ── Users ────────────────────────────────────────────────────────────

export interface AdminUserInfo {
  id: number;
  username: string;
  role: string;
  active: number;
  created_at: string;
  last_login: string | null;
  totp_enabled?: number;
  must_change_password?: number;
}

export function getUsers(): Promise<{ users: AdminUserInfo[] }> {
  return request<{ users: AdminUserInfo[] }>('/users');
}

export function createUser(username: string, password: string, role: string): Promise<{ user: AdminUserInfo }> {
  return request<{ user: AdminUserInfo }>('/users', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });
}

export function revokeUser(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' });
}

export function activateUser(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}/activate`, { method: 'POST' });
}

export function changeRole(id: number, role: 'admin' | 'superadmin'): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}/role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export function changePassword(id: number, password: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}/password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// ── 2FA (TOTP) ───────────────────────────────────────────────────────

export function totpSetup(): Promise<{ secret: string; uri: string }> {
  return request<{ secret: string; uri: string }>('/totp/setup', { method: 'POST' });
}

export function totpEnable(code: string): Promise<{ enabled: boolean; recoveryCodes: string[] }> {
  return request<{ enabled: boolean; recoveryCodes: string[] }>('/totp/enable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function totpDisable(password: string, code?: string, userId?: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/totp/disable', {
    method: 'POST',
    body: JSON.stringify({ password, ...(code ? { code } : {}), ...(userId ? { userId } : {}) }),
  });
}

export const MIN_PASSWORD_LENGTH = 10;
