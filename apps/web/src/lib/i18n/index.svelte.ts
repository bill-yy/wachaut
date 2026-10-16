/**
 * Reactive locale for client-rendered pages (rooms and shared components).
 *
 * Detection order: stored preference → browser language → Spanish.
 * The landing (/ and /en/) is server-rendered per locale and PERSISTS the
 * choice here on mount, so the room UI follows the language the visitor
 * picked on the landing.
 */

import { dict, type DictKey, type Locale } from './dict';

const LANG_KEY = 'wachaut.lang';

function detect(): Locale {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'es' || stored === 'en') return stored;
  } catch { /* private mode */ }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return 'es';
}

export const i18n = $state<{ locale: Locale }>({ locale: detect() });

export function setLocale(locale: Locale): void {
  i18n.locale = locale;
  try { localStorage.setItem(LANG_KEY, locale); } catch { /* private mode */ }
}

/** Translate a key in the active locale (falls back to Spanish, then the key).
 *  `{name}` placeholders in the value are replaced with `params`. */
export function t(key: DictKey, params?: Record<string, string | number>): string {
  let text = dict[i18n.locale][key] ?? dict.es[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

/**
 * Map a server-emitted (Spanish) message to the active locale. Server
 * messages arrive in Spanish; when the UI is English we show the known
 * translations, falling back to the original text.
 */
const SERVER_MAP: Record<string, DictKey> = {
  'Servidor en mantenimiento. Vuelve a intentarlo en unos minutos.': 'srv.maintenance',
  'Demasiadas peticiones.': 'srv.tooMany',
  'Servidor lleno. Intenta más tarde.': 'srv.full',
  'Ya tienes una sala activa. Ciérrala antes de crear otra.': 'srv.oneRoom',
  'No se ha encontrado la sala. Comprueba el enlace.': 'srv.roomNotFound',
  'La sala está llena. Espera a que alguien salga.': 'srv.roomFull',
  'PIN incorrecto. Comprueba que lo hayas escrito bien.': 'srv.wrongPinJoin',
  'Elige un username de al menos 2 caracteres.': 'srv.nameMin',
  'Demasiados intentos. Espera un momento.': 'srv.tooManyAttempts',
  'PIN o clave de host incorrectos para reclaim.': 'srv.reclaimBad',
  'Expulsado por el anfitrión': 'srv.kicked',
  'Expulsado por un administrador': 'srv.kickedAdmin',
  'Error interno. Inténtalo de nuevo en unos segundos.': 'srv.internal',
  'No se ha encontrado al espectador. Puede que ya se haya ido.': 'srv.kickNotFound',
};

export function srv(message: string | undefined | null): string {
  if (!message) return '';
  const key = SERVER_MAP[message];
  return key ? t(key) : message;
}
