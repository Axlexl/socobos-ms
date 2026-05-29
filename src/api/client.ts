/**
 * MySQL API client
 * All HTTP calls to the PHP backend go through here.
 *
 * ── Setup ──────────────────────────────────────────────────────
 * Change BASE_URL to your server address:
 *   - XAMPP local:  'http://192.168.1.x/socobos-api'   (use your PC's local IP)
 *   - Shared host:  'https://yourdomain.com/socobos-api'
 *
 * To find your local IP on Windows: run `ipconfig` in CMD
 * ──────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://socobos.infinityfreeapp.com/socobos-api';

const TOKEN_KEY = 'auth_token';

// ─── Token helpers ────────────────────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { error: text }; }

  if (!res.ok) {
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(password: string): Promise<void> {
  const data = await apiFetch<{ token: string }>('/auth/login.php', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  await saveToken(data.token);
}

export async function apiLogout(): Promise<void> {
  await clearToken();
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const apiGetRooms    = ()                          => apiFetch<any[]>('/rooms/index.php');
export const apiAddRoom     = (room: any)                 => apiFetch('/rooms/index.php', { method: 'POST', body: JSON.stringify(room) });
export const apiUpdateRoom  = (id: string, data: any)    => apiFetch(`/rooms/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteRoom  = (id: string)               => apiFetch(`/rooms/index.php?id=${id}`, { method: 'DELETE' });

// ─── Tenancies ────────────────────────────────────────────────────────────────

export const apiGetTenancies   = ()                       => apiFetch<any[]>('/tenancies/index.php');
export const apiAddTenancy     = (t: any)                 => apiFetch('/tenancies/index.php', { method: 'POST', body: JSON.stringify(t) });
export const apiUpdateTenancy  = (id: string, data: any) => apiFetch(`/tenancies/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });

// ─── Bills ────────────────────────────────────────────────────────────────────

export const apiGetBills    = ()                          => apiFetch<any[]>('/bills/index.php');
export const apiAddBill     = (bill: any)                 => apiFetch('/bills/index.php', { method: 'POST', body: JSON.stringify(bill) });
export const apiUpdateBill  = (id: string, data: any)    => apiFetch(`/bills/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });

// ─── Payments ─────────────────────────────────────────────────────────────────

export const apiGetPayments = ()                          => apiFetch<any[]>('/payments/index.php');
export const apiAddPayment  = (payment: any)              => apiFetch('/payments/index.php', { method: 'POST', body: JSON.stringify(payment) });

// ─── Rates ────────────────────────────────────────────────────────────────────

export const apiGetRates    = ()                          => apiFetch<any>('/rates/index.php');
export const apiUpdateRates = (rates: any)                => apiFetch('/rates/index.php', { method: 'PUT', body: JSON.stringify(rates) });
