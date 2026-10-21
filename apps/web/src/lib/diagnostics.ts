/**
 * Client-side diagnostics report — the "copiar diagnóstico" feature.
 * Builds a plain-text block a user can paste into a bug report, so support
 * conversations start with real numbers instead of "se ve mal".
 */

export interface DiagnosticsFields {
  [key: string]: string | number | null | undefined;
}

export function buildDiagnosticsReport(section: string, fields: DiagnosticsFields): string {
  const lines = [`# Wachaut diagnóstico — ${section}`, `fecha: ${new Date().toISOString()}`];
  for (const [key, value] of Object.entries(fields)) {
    lines.push(`${key}: ${value ?? '—'}`);
  }
  lines.push(`userAgent: ${typeof navigator !== 'undefined' ? navigator.userAgent : '—'}`);
  lines.push(`url: ${typeof location !== 'undefined' ? location.origin + location.pathname : '—'}`);
  return lines.join('\n');
}

/** Human relay/ICE path label from an RTCStats candidate-pair local candidate. */
export function icePathLabel(candidateType: string | null | undefined): string {
  switch (candidateType) {
    case 'relay': return 'TURN (relay)';
    case 'srflx': return 'STUN (directo NAT)';
    case 'prflx': return 'directo (prflx)';
    case 'host': return 'directo (host)';
    default: return '—';
  }
}
