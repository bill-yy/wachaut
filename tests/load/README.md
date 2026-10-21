# Load test — ¿cuánta carga real aguanta la VPS?

Suite de capacidad con navegadores reales: arranca un host que comparte
pantalla de verdad (Chromium con auto-selección de captura) y N viewers
headless consumiendo el stream, mientras se muestrea el estado del servidor.

## Qué mide

- **Lado cliente** (por viewer, cada 10s): `getVideoPlaybackQuality()` del
  `<video>` — frames decodificados y perdidos → detecta degradación real.
- **Lado servidor**: `/health` y `/api/status` (salas/peers vivos) muestreados
  por el orquestador + `docker stats` y carga del host capturados en la VPS
  por `sample-server.sh` (correrlo por SSH en paralelo).

## Requisitos (una vez)

```bash
cd tests/load
npm install          # playwright (dev-only)
npx playwright install chromium
```

## Uso

1. **En la VPS** (SSH, en paralelo al test):

   ```bash
   ./sample-server.sh 600   # muestrea 10 min → /tmp/wachaut-load.csv
   ```

2. **Desde tu máquina** (contra el entorno de pruebas):

   ```bash
   node run.mjs \
     --base-url https://wachaut.billytech.es \
     --rooms 1 --viewers 10 \
     --minutes 5
   ```

   Rampas sugeridas para el informe de capacidad:
   `1×5`, `1×10`, `1×20`, `2×10`, `5×4` — hasta ver degradación
   (frames perdidos >2% sostenidos o CPU del SFU >80%).

3. Copia `/tmp/wachaut-load.csv` de la VPS junto a los CSV locales y genera
   el informe:

   ```bash
   node report.mjs results/   # → results/informe-<fecha>.md
   ```

## Notas de método

- Corre el orquestador **fuera de la VPS** (los viewers headless consumen
  CPU propia; medirlos en el mismo host falsea la lectura).
- Los viewers headless no renderizan a pantalla, pero decodifican el stream
  completo: la métrica de frames es representativa del trabajo de red/decode.
- El ancho de banda de tu conexión limita cuántos viewers puedes simular:
  anótalo en el informe (con 300 Mbps simulas ~50 viewers a 4.5 Mbps).
- `MAX_CONNECTIONS_PER_IP` (default 8) limita conexiones por IP: para >8
  viewers desde una sola máquina, súbelo en el entorno de pruebas
  (`MAX_CONNECTIONS_PER_IP=64`).

## Veredicto del spike de codecs (2026-10-21)

Spike E2E (host auto-captura + viewer real contra SFU real, métricas vía
hook de `RTCPeerConnection.getStats()` — el `<video>` headless solo no
distingue "no llega media" de "artefacto de render"):

| Modo (`SFU_VIDEO_MODE`) | Host codifica | Viewer decodifica | Veredicto |
|---|---|---|---|
| `vp8-single` (default) | ✅ | ✅ | Histórico, probado en prod |
| `vp9-svc` (L3T3) | ❌ 0 bytes/0 frames | ❌ | **MUERTO en Chromium 155/156** |
| `vp8-simulcast` | ✅ 3 capas | ✅ (frames + decoder OK) | **Layerizado elegido** |

Hallazgos del spike:

- **VP9 + `scalabilityMode: "L3T3"` hace que el encoder de Chromium nunca
  arranque**: 0 bytes / 0 frames encoded, PC connected, sin un solo error
  en consola. Medido en Chromium empaquetado (headless y headed) y Chrome
  de sistema, con y sin aceleración HW. VP9 SIN scalabilityMode codifica
  normal → el trigger exacto es SVC-on-VP9, no VP9 en sí. El histórico
  "VP9 stallea ICE" era este stall del encoder visto como pantalla negra.
- **Simulcast exige fijar VP8 explícito** (`codec` en produce()): sin ello
  Chrome elige su default (AV1 en versiones actuales) y mediasoup lo
  rechaza: "video/AV1 codec not supported for simulcast".
- **Los parámetros x-google-\* del router del SFU** se propagan tal cual al
  fmtp del sender de cada cliente — eliminados del router (los techos de
  bitrate van en `setMaxIncomingBitrate` + `maxBitrate` por encoding).
- Bugs de harness que produjeron falsos FALLOs (documentados para no
  repetirlos): login del viewer con selectores genéricos (strict-mode
  silencioso), click del CTA interceptado por overlays (forzar con
  `force: true`), y "VP9 funciona headless" con answer que en realidad
  negociaba VP8 (verificar el PT real del answer, no el primer PT del m-line).

Re-evaluar `vp9-svc` (o AV1 SVC) cuando Chrome madure: basta cambiar
`SFU_VIDEO_MODE` en el SFU y correr `node spike-svc.mjs` de nuevo.
