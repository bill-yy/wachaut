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
| `VITE_SFU_URL` | URL del SFU (wss://) | `wss://sfu-wachaut.billytech.es` |
| `TURN_SECRET` | Shared secret para coturn | — |
| `TURN_URL` | URL del TURN server | — |
| `RTC_ANNOUNCED_IP` | IP pública para ICE candidates | — |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `https://wachaut.billytech.es` |

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
