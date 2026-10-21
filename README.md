# Wachaut

Comparte tu pantalla con amigos al instante. Sin registro, sin descargas.

Wachaut es una app de screen sharing en tiempo real construida con arquitectura SFU (mediasoup). Un host comparte su pantalla y hasta 20 espectadores pueden verla, chatear y reaccionar — todo desde el navegador.

## Stack

- **Frontend:** SvelteKit + Svelte 5 (runes) + Tailwind CSS v4
- **Signaling:** Fastify + Socket.IO
- **Media:** mediasoup SFU (VP9 SVC, TURN/coturn)
- **Icons:** lucide-svelte
- **Fonts:** Inter (UI) + Bricolage Grotesque (display), self-hosted
- **Deploy:** Docker + Traefik + Dokploy

## Estructura

```
apps/
  web/      — SvelteKit SPA (landing, host, viewer)
  server/   — Fastify + Socket.IO signaling server
  sfu/      — mediasoup SFU para routing de media
```

## Setup local

```bash
pnpm install
pnpm dev          # arranca web + server + sfu
```

El web corre en `http://localhost:5173`.

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_WS_URL` | URL del signaling server (wss://) | `wss://api-wachaut.billytech.es` |
| `VITE_SFU_URL` | URL del SFU (wss://); el server también la usa en runtime para health/errors | `wss://sfu-wachaut.billytech.es` |
| `TURN_SECRET` | Shared secret para coturn | — |
| `TURN_URL` | URL del TURN server | — |
| `RTC_ANNOUNCED_IP` | IP pública para ICE candidates (**obligatoria en producción** — el SFU no arranca sin ella) | — |
| `RTC_MIN_PORT` / `RTC_MAX_PORT` | Rango UDP de media — debe coincidir EXACTO con los puertos publicados del contenedor | `40000`–`49999` |
| `MAX_INCOMING_BITRATE` | Techo del uplink del host en bps (deja holgura sobre el preset alto, 8 Mbps) | `10000000` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) — **incluye todos los orígenes que sirvan el cliente** | `https://wachaut.billytech.es` |
| `ADMIN_JWT_SECRET` | Secreto de firma de los tokens admin (**obligatorio en producción**, `openssl rand -hex 32`) | — |
| `ADMIN_BOOTSTRAP_PASSWORD` | Contraseña del primer superadmin si la BD está vacía (≥10 chars; se fuerza su rotación al primer login) | — |
| `ADMIN_JWT_EXPIRY` | Duración del token admin (formato jsonwebtoken) | `8h` |
| `MAX_CONNECTIONS_PER_IP` | Conexiones socket por IP (subir en load tests) | `8` |
| `ROOM_IDLE_TTL_MS` / `HOST_RECONNECT_GRACE_MS` | TTL de salas abandonadas / gracia de reconexión del host | `4h` / `30s` |
| `WACHAUT_DB_PATH` | Ruta del SQLite (montar un volumen en Docker) | `./data/wachaut.db` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push (se autogeneran en `data/push-keys.json` si no se setean) | — |
| `RESEND_API_KEY` / `ADMIN_NOTIFY_EMAIL` | Alertas admin por email (opcional) | — |

## Despliegue — SFU de producción

El SFU de `wachaut.com` se despliega como **Compose** (`docker/docker-compose.prod-sfu.yml`)
en el entorno production de Dokploy: rango UDP nativo 40000-40399 (~400 transports),
restart garantizado y signaling por Traefik (`sfu.wachaut.com`, naranja en Cloudflare).
El checklist completo (DNS, firewall, build args) va en comentarios al principio del YAML.
La suite de capacidad vive en `tests/load/` (ver su README).

## Panel de administración

Acceso en el subdominio admin (`wadmin.*`) vía `/admin`. Flujo de seguridad:

- **Login** con usuario/contraseña + **2FA (TOTP)** si está activado. 5 intentos
  por IP cada 10 minutos; todo queda en el log de auditoría.
- **Rotación forzada**: las cuentas creadas vía bootstrap o CLI deben cambiar su
  contraseña en el primer login (y al cambiarla se invalidan todas sus sesiones).
- **Roles**: `admin` (panel completo) y `superadmin` (además: usuarios, roles y
  modo mantenimiento). Los cambios de rol/revocación aplican al instante sobre
  sesiones vivas.
- **2FA por usuario** con QR (generado en el navegador) y códigos de
  recuperación de un solo uso.
- **Moderación**: cerrar salas y expulsar espectadores desde el dashboard.
- **Auditoría completa** paginada (login, 403, 429, usuarios, 2FA, moderación…).
- **Errores y conexiones**: pestaña con los errores agrupados por huella
  (web/server/SFU) con flujo abierto → reconocido → resuelto (reaparecer
  reabre automáticamente), y telemetría de pérdidas de conexión en
  retransmisiones (causa red/salida limpia, duración, recuperación del host
  con latencia, viewers afectados). El beacon público `POST /api/errors`
  está limitado por IP; los orígenes server/SFU se autentican con
  `ERRORS_SECRET`.

Gestión por CLI dentro del contenedor del server:

```bash
node dist/admin/setup.js create-user        # crear admin (interactivo)
node dist/admin/setup.js list-users         # listar (muestra 2FA)
node dist/admin/setup.js reset-password <u> # reset (invalida sesiones)
```

## Deploy

Los servicios se despliegan via Docker Compose + Traefik en Dokploy:

```bash
# Producción
docker compose -f infra/docker-compose.prod.yml up -d
```

Ver `.env.example` para las variables necesarias.

## Scripts

```bash
pnpm --filter web dev       # dev server web
pnpm --filter web build     # build producción
pnpm --filter web check     # svelte-check
pnpm --filter server dev    # dev server signaling
pnpm --filter server test   # tests unitarios
pnpm --filter sfu dev       # dev SFU
```

## Licencia

Privado.
