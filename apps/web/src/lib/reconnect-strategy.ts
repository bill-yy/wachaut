/**
 * Pure reconnect strategy helpers for viewers.
 *
 * Extracted from the viewer route so the backoff schedule and ICE-restart
 * decisions can be unit-tested without booting SvelteKit / mediasoup.
 */

/**
 * Viewer reconnect backoff schedule (ms). 8 attempts covering ~4 min total,
 * long enough to outlast most transient network blips and brief host
 * reconnect windows. Mirrors MAX_VIEWER_RECONNECT_ATTEMPTS in the viewer page.
 */
export const VIEWER_RECONNECT_DELAYS_MS = [
  1000, 2000, 4000, 8000, 15000, 30000, 60000, 120000,
];

export const MAX_VIEWER_RECONNECT_ATTEMPTS = VIEWER_RECONNECT_DELAYS_MS.length;

/** Return the delay for the given attempt index (0-based). */
export function reconnectDelayForAttempt(attempt: number): number {
  if (attempt < 0) return VIEWER_RECONNECT_DELAYS_MS[0];
  if (attempt >= VIEWER_RECONNECT_DELAYS_MS.length) {
    return VIEWER_RECONNECT_DELAYS_MS[VIEWER_RECONNECT_DELAYS_MS.length - 1];
  }
  return VIEWER_RECONNECT_DELAYS_MS[attempt];
}

/** True once the viewer has exhausted all reconnect attempts. */
export function shouldGiveUpReconnect(attempt: number): boolean {
  return attempt >= MAX_VIEWER_RECONNECT_ATTEMPTS;
}

// ─── ICE state decisions ────────────────────────────────────────────────

/** ICE states that warrant an immediate client-side restartIce(). */
export function shouldForceIceRestart(iceConnectionState: string): boolean {
  return iceConnectionState === "failed";
}

/**
 * ICE states where we should ARM a watchdog — if the state doesn't recover
 * within DISCONNECT_RESTART_MS, we force a restartIce() preemptively.
 */
export const DISCONNECT_RESTART_MS = 10_000;

export function shouldArmDisconnectWatchdog(
  iceConnectionState: string,
): boolean {
  return iceConnectionState === "disconnected";
}

/** States that clear any armed watchdog (recovered / closed). */
export function clearsDisconnectWatchdog(iceConnectionState: string): boolean {
  return ["connected", "completed", "closed", "failed"].includes(
    iceConnectionState,
  );
}

// ─── Host SFU re-join ───────────────────────────────────────────────────

/**
 * Backoff for a host re-join the SFU answers with "Room already exists".
 *
 * That answer means the SFU still holds the previous host socket: its death
 * is only detected by ping timeout (up to pingInterval + pingTimeout ≈ 45s
 * after the network changed), while the client reconnects within seconds.
 * The schedule must reach past that lag and into the 30s grace window that
 * follows it, so the re-join lands once the room is reclaimable instead of
 * the page sitting on a socket that is in no room (61s of retries here).
 */
export const HOST_REJOIN_RETRY_DELAYS_MS = [
  1000, 2000, 4000, 8000, 16000, 30000,
];

/** True for the SFU re-join error that is worth retrying. */
export function isTransientRejoinError(message: string): boolean {
  return message === "Room already exists";
}

/** Delay before the next re-join attempt, or null once the schedule is exhausted. */
export function rejoinDelayForAttempt(attempt: number): number | null {
  if (attempt < 0 || attempt >= HOST_REJOIN_RETRY_DELAYS_MS.length) return null;
  return HOST_REJOIN_RETRY_DELAYS_MS[attempt];
}
