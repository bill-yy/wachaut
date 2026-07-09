/**
 * Admin API client — handles JWT auth and all /api/admin/* requests.
 * The API base URL is the same origin (wadmin.billytech.es) since the
 * Fastify server is fronted by Traefik on the same subdomain.
 */

const TOKEN_KEY = 'admin_token';
const API_BASE = '/api/admin';

function getToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setToken(token: string): void {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
}

function clearToken(): void {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<{ token: string; user: AdminUserInfo }> {
  const data = await request<{ token: string; user: AdminUserInfo }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export function logout(): void {
  clearToken();
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

// ── Rooms ────────────────────────────────────────────────────────────

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

// ── Stats ────────────────────────────────────────────────────────────

export interface AdminStats {
  traffic: { date: string; total_rooms: number; peak_viewers: number; total_viewers: number; countries: string }[];
  countries: { country: string; count: number }[];
  totalRoomsCreated: number;
}

export function getStats(): Promise<AdminStats> {
  return request<AdminStats>('/stats');
}

// ── Security ─────────────────────────────────────────────────────────

export interface AdminSecurity {
  ips: { ip: string; connections: number; country: string }[];
  auditLog: { username: string; action: string; ip: string; country: string; timestamp: string }[];
}

export function getSecurity(): Promise<AdminSecurity> {
  return request<AdminSecurity>('/security');
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

export function changePassword(id: number, password: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}/password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}
