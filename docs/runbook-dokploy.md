# Runbook Dokploy — rarezas conocidas y recuperación

Lecciones operativas de los incidentes de octubre 2026 (caída del 18-oct,
pantalla negra del 19-oct). Cuando algo raro pase, empieza por aquí.

## Síntoma: un deploy de Dokploy marca "done" pero no cambia nada

Visto en el SFU (app de imagen docker): el log del deployment acaba tras el
pull y la task swarm no se recrea. El botón Redeploy tampoco lo hace.

```bash
docker ps -a --filter label=com.docker.swarm.service.name=<servicio>
docker service update --force <servicio>   # esto sí recrea la task
```

Si el update se atasca con `no suitable node (host-mode port already in use)`:

```bash
docker rm <contenedor de la task parada>          # libera el slot
docker service update --update-order stop-first <servicio>   # luego esto
```

## Síntoma: todo el web caído tras un reinicio del host

Los servicios swarm (apps tipo Application) se recuperan solos; **las compose
y contenedores sin `restart: always` no**. Tras cualquier reboot de la VPS:

```bash
docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -v " Up "
docker start <nombre>              # por cada Exited que deba vivir
```

Blindajes ya aplicados: `dokploy-traefik` y coturn con `restart: always`;
el SFU de producción es Compose con `restart: always` (docker-compose.prod-sfu.yml).

## Síntoma: panel de Dokploy caído pero apps vivas

El panel se sirve por el mismo Traefik: casi siempre es solo el contenedor
`dokploy-traefik` muerto. `docker start dokploy-traefik` y espera <1 min.
Si el core de Dokploy crash-loopea con "Waiting for postgres": la red overlay
quedó rota tras el reboot — `docker service update --force dokploy-postgres dokploy`.

## Síntoma: viewers ven pantalla negra, sala y chat funcionan

Cadena de diagnóstico (en orden):

1. ¿El SFU acepta el origen? `curl -sD - -o /dev/null -H "Origin: https://wachaut.com" "https://<sfu-host>/socket.io/?EIO=4&transport=polling"` —
   debe devolver `Access-Control-Allow-Origin`. Si no: `ALLOWED_ORIGINS` del SFU.
2. ¿Los puertos RTC coinciden? `RTC_MIN/MAX_PORT` del SFU deben ser EXACTAMENTE
   los publicados (`docker inspect <sfu> | grep -A3 PortBindings`). Un rango
   escuchado pero no publicado = todo el video por TURN (y si coturn está
   muerto, pantalla negra total).
3. ¿coturn vivo? `nc -zv <ip> 3478`.

## Checklist tras tocar el entorno de producción

- [ ] `wachaut.com` carga y `/api/status` responde `status: ok`
- [ ] Sala end-to-end: host comparte + viewer recibe video
- [ ] `sfu.wachaut.com/health` → `{"status":"ok"...}`
- [ ] `wadmin.wachaut.com/admin` login OK
- [ ] Monitor externo (Cloudflare health checks / UptimeRobot) sin alertas
