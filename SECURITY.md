# Security notes / threat model — Wachaut

Contexto de seguridad del proyecto para auditorías (humanas y automatizadas).
Los puntos aquí documentados son decisiones deliberadas, no descuidos.

## CRYPTO: HMAC-SHA1 en credenciales TURN — riesgo aceptado

`apps/sfu/src/index.ts` (`generateTurnCredentials`) deriva credenciales TURN
efímeras con `HMAC-SHA1(secret, "expiry:uuid")`.

- **Por qué SHA1**: es el formato que exige coturn con `--use-auth-secret`
  (draft-uberti-behave-turn-rest, el estándar de facto de TURN REST). No hay
  alternativa interoperable; cambiar el algoritmo rompe el acceso de viewers
  detrás de NAT estricto.
- **Por qué no es una debilidad real**: la seguridad de HMAC no depende de la
  resistencia a colisiones del hash subyacente. HMAC-SHA1 como PRF sigue
  siendo criptográficamente sólido y está permitido por NIST para
  autenticación. Los ataques SHAttered (colisión) no aplican a este uso.
- **Mitigaciones**: secreto de 256 bits (`openssl rand -hex 32`), credenciales
  con TTL de 30 min, rotación cliente cada 25 min.

## CRYPTO: TOTP con SHA1 — riesgo aceptado

`apps/server/src/admin/totp.ts` usa HMAC-SHA1: es el algoritmo por defecto
del RFC 6238 que implementan todas las apps autenticadoras (Google
Authenticator & co). Cambiar a SHA256 rompe la compatibilidad con los TOTP ya
registrados por los usuarios.

## SSRF: URLs del SFU validadas antes de todo fetch

Todo fetch del server hacia el SFU (readiness `/ready`, drain de errores,
health del admin) pasa por `toSafeHttpUrl` (`apps/server/src/security.ts`):
solo http/https públicos; localhost, loopback, privadas, link-local
(169.254.169.254 incluido), CGNAT, multicast, ULA y nombres *.local/*.internal
quedan rechazados. Tests en `apps/server/test/security.test.ts`.

## Privacidad de IPs

Ninguna tabla almacena IPs crudas: pageviews/errors/feedback usan hash
salado truncado, `room_events.host_ip` guarda hash desde 2026-10 (el
histórico crudo fue anulado por migración one-time). El audit log admin
guarda IP cruda deliberadamente (traza de seguridad de un panel interno).
