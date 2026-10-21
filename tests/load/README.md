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
