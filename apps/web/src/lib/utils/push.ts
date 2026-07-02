import { browser } from '$app/environment';

let vapidUrl = '';

export function setVapidUrl(url: string): void {
  vapidUrl = url;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function isPushSupported(): Promise<boolean> {
  if (!browser) return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getPushPermissionState(): Promise<NotificationPermission> {
  if (!browser) return 'default';
  if (!('Notification' in window)) return 'default';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!browser) return 'default';
  if (!('Notification' in window)) return 'default';
  return Notification.requestPermission();
}

export async function subscribeToPush(roomId: string, serverUrl?: string): Promise<PushSubscriptionJSON | null> {
  if (!browser) return null;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  const permission = await requestPushPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }

  const vapidUrl = serverUrl ? `${serverUrl}/push/vapid-public-key` : getDefaultVapidUrl();
  const res = await fetch(vapidUrl);
  const { publicKey } = (await res.json()) as { publicKey: string };
  if (!publicKey) return null;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  } as PushSubscriptionOptionsInit);

  return subscription.toJSON() as PushSubscriptionJSON;
}

function getDefaultVapidUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/push/vapid-public-key`;
}

export async function unsubscribePush(): Promise<void> {
  if (!browser) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
