# Plan de fix: bugs de expulsión masiva y cortes en retransmisiones largas

## Diagnóstico (resumen)

**Bug 1 — Expulsión masiva a las ~2h:** causado por un TTL hard-coded en `apps/server/src/index.ts:154-168` que mide desde `createdAt` (no desde última actividad). Los partidos del mundial duran ~120-130 min y lo superan.

**Bug 2 — Cortes:** tres causas críticas convergentes:
1. **Credenciales TURN expiran a la 1h** (`apps/sfu/src/index.ts:29`) y no se refrescan → viewers detrás de NAT/firewall estricto caen a los ~60 min.
2. **No existe ICE restart** en ningún lado (0 resultados en grep) → cualquier blip de red que lleve el ICE a `failed` es permanente.
3. **Reclaim del host roto en signaling**: el handler `host:create-room` siempre genera un `roomId` nuevo ignorando el del cliente (`apps/server/src/index.ts:282`), el SFU sí tiene reclaim, el signaling no → quedan desincronizados. Además, tras un reconnect, el host **no restaura los producers** mediasoup → pantalla negra para viewers.

---

## Fase 1 — Bug 1: Política de TTL basada en actividad

**`apps/server/src/index.ts`:**
- Añadir `lastActivityAt: Date` al tipo `Room`, inicializada en `createdAt` y actualizada en cada evento significativo (`viewer:joined`, `chat:message`, `reaction:send`, `host:set-sharing`).
- Sustituir el TTL de "2h desde `createdAt`" por **"4h desde `lastActivityAt`"** (env `ROOM_IDLE_TTL_MS`, default `4 * 60 * 60 * 1000`).
- Mantener la limpieza cada 5 min pero usar el nuevo criterio.
- En el handler `host:create-room` (líneas 264-307), **implementar reclaim**: si ya existe `rooms.get(roomId)` y su `hostId` ya no está conectado (o pertenece a un socket desconectado), permitir al host "reclamar" la sala actualizando `hostId = socket.id` y rebind en `hostToRoom`, en lugar de generar un UUID nuevo. Esto alinea el comportamiento con el SFU.
- Emitir `room:closed` solo cuando la sala esté realmente abandonada (sin host reconectado y sin viewers con `connected === true`).

**`apps/sfu/src/index.ts`:**
- Añadir un TTL espejo (inactivo) en el SFU que cierre rooms huérfanas (sin host y sin viewers) tras 4h, evitando la fuga actual de routers/transports cuando el server cierra por TTL. Limpieza cada 5 min.

---

## Fase 2 — Bug 2A: Refresco de credenciales TURN + ICE restart

**`apps/sfu/src/index.ts`:**
- Bajar `TURN_EXPIRY_SECONDS` default a **1800s (30 min)** para credenciales más frescas.
- Añadir un handler `refresh-ice-servers` que el cliente puede invocar periódicamente (o ante ICE en degradación) para obtener credenciales nuevas. Responde con `{ iceServers }` fresco.
- Cuando el SFU detecta `icestatechange → 'failed'` en un `WebRtcTransport`, **llamar `transport.restartIce()`** (API mediasoup) para generar nuevos ICE candidates, y emitir `ice-restart` al cliente con los nuevos `iceParameters`.

**`apps/web/src/lib/sfu-client.ts`:**
- Implementar un timer interno (cada 25 min) que pida `refresh-ice-servers` y llame `pc.setConfiguration({ iceServers: nuevos })` en el `RTCPeerConnection` subyacente (vía `transport._handler._pc`, igual que hace `#monitorIce`). Esto renueva las allocations TURN antes de que caduquen.
- En `#monitorIce`, escuchar `iceconnectionstatechange` y, ante `'failed'` o `'disconnected'` prolongado, **forzar `pc.restartIce()`** del lado cliente (lo que dispara nuevo ICE gathering y reconecta sin recrear transport).
- Sustituir los `devlog` por `console.error` en los branches `failed` (en producción `devlog` es no-op).

---

## Fase 3 — Bug 2B: Reclaim del host en ambos servidores + re-producción

**`apps/server/src/index.ts` (signaling):**
- Reescribir `host:create-room` para que **acepte el `roomId` del cliente** y:
  - Si la sala existe y el host anterior está desconectado → reclaim (actualizar `hostId`, cancelar el `setTimeout` de 30s del `disconnect` si sigue pendiente).
  - Si no existe → crear nueva con ese `roomId` (mantener el UUID si el cliente lo envía).
- Añadir campo `hostReclaimableUntil?: number` en `Room` para trackear el grace window.

**`apps/sfu/src/index.ts`:**
- En `disconnect` del host, **NO cerrar los producers inmediatamente** si la sala sigue en el grace window. Mantenerlos vivos para que al reclamar el host no tenga que re-producir desde cero.
- Al reclamar la sala, rebindear los producers existentes al nuevo `socketId` del host (en la práctica los producers ya existen, solo hay que mantenerlos).

**`apps/web/src/routes/room/+page.svelte` (host):**
- En el handler `socket.on('connect')` (líneas 454-483), distinguir entre primera conexión y reconnect:
  - Si `sfuClient` ya existe y la sala fue reclamada correctamente → emitir un evento `host:reclaim-produced` si hace falta, o asegurar que `produce()` se vuelve a llamar si los producers se cerraron.
  - En cualquier caso, si los producers están cerrados (`producer.closed === true`), volver a llamar `sfuClient.produce(currentStream)`.
- Escuchar el evento `disconnected` del `sfuClient` y forzar re-join + re-produce si se detecta.

---

## Fase 4 — Bug 2C: Mejorar reconexión del viewer

**`apps/web/src/routes/room/[roomId]/+page.svelte`:**
- Sustituir `MAX_VIEWER_RECONNECT_ATTEMPTS = 3` por `8` con backoff exponencial 1s→2s→4s→8s→15s→30s→60s→120s.
- El handler `host:disconnected` no debe pasar a `status = 'error'` inmediatamente: pasar a `status = 'reconnecting'` y esperar 30s (alineado con el grace del SFU). Si durante ese tiempo llega `host:reconnected` (nuevo evento), volver a `connected`. Solo si no recupera, ir a error.
- Resetear `reconnectAttempt` cuando se reconecte con éxito.

**`apps/server/src/index.ts`:**
- Emitir `host:reconnected` a la sala cuando el host hace reclaim exitoso, para que los viewers vuelvan a `connected`.

---

## Fase 5 — Mitigaciones estructurales

- **`docker-compose.yml` / `infra/docker-compose.prod.yml`:** subir `server.mem_limit` de `512m` a `768m` (mitiga riesgo de OOM con presencia + chat de salas largas).
- **`apps/server/src/index.ts`:** limpiar `connectionCounts` de IPs sin actividad reciente en el mismo intervalo de 5 min (previene el slow leak detectado en la auditoría y bloquea a viewers de un mismo CGNAT reconectando a la vez).

---

## Fase 6 — Tests automatizados

Stack actual: **`node --test` + tsx** (no Vitest), ya configurado en `apps/server/package.json` script `test`. No existe directorio `test/` todavía.

### `apps/server/test/room-ttl.test.ts`
- Sala recién creada con viewers activos no se cierra tras 2h+ en reloj real.
- Sala sin actividad durante `ROOM_IDLE_TTL_MS` sí se cierra.
- `lastActivityAt` se actualiza con `viewer:joined`, `chat:message`, `reaction:send`.
- Refactor: extraer la lógica de cleanup a una función pura `gcExpiredRooms(rooms, now)` para testear sin intervalo real.

### `apps/server/test/host-reclaim.test.ts`
- Host crea sala, se desconecta, vuelve dentro del grace → puede reclamar la misma sala (mismo `roomId`, no se genera uno nuevo).
- Viewers en la sala no reciben `room:closed` durante el reclaim.
- Otro host intentando reclamar una sala de un host activo → rechazado.

### `apps/sfu/test/turn-refresh.test.ts`
- `generateTurnCredentials()` produce credenciales con expiry en el futuro.
- Handler `refresh-ice-servers` responde con credenciales frescas distintas cada vez.
- `TURN_EXPIRY_SECONDS=1800` por defecto.

### `apps/web/src/lib/sfu-client.test.ts` (unitario)
- Mock mínimo de `RTCPeerConnection` y `socket.io-client` para verificar:
  - El timer de refresco TURN llama `setConfiguration` con nuevos iceServers a los 25 min.
  - `iceconnectionstatechange → 'failed'` dispara `pc.restartIce()`.

---

## Fase 7 — Validación final

- `pnpm -r typecheck`
- `pnpm -r test`
- Manual (te lo documentaré en un checklist):
  - Crear sala y dejar host compartiendo 2h+ con viewer conectado → no se cae.
  - En viewer detrás de VPN/NAT, dejarlo >1h → stream sigue.
  - Simular microcorte del host (desconectar wifi 5s) → viewers no son expulsados y el video se recupera.
  - Forzar `iceconnectionstatechange → failed` (DevTools throttling "Offline" 30s) → ICE restart recupera sin recrear sala.

---

## Notas

- **No rompo compatibilidad**: los eventos Socket.IO existentes (`room:closed`, `host:disconnected`, etc.) se mantienen; solo añado nuevos (`host:reconnected`, `refresh-ice-servers`, `ice-restart`).
- **Todo configurable via env** con defaults razonables (siguiendo el patrón existente en `apps/sfu/src/index.ts`).
- **No toco**: codec config (VP8), UI de landing, admin panel, ni despliegue de Dokploy más allá del `mem_limit`.
- **Orden de implementación**: Fases 1 → 2 → 3 → 4 → 5 → 6 → 7. Cada fase es desplegable por separado si hace falta hotfix incremental.