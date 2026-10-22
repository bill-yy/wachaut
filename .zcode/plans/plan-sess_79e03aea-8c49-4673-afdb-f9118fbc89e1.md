# Plan: Contacto → panel + Valoraciones post-retransmisión con preguntas clave

## A — Contacto (adiós al correo inexistente)

**Server** (`apps/server/src/feedback.ts` nuevo, patrón analytics.ts):
- Tabla `contact_messages (id, ts, name, email, message, page, ip_hash, country, read INTEGER DEFAULT 0)`.
- `POST /api/contact` público (esquema estricto: mensaje 5–2000 obligatorio; nombre ≤64 y email ≤128 opcionales con validación; rate-limit 5/min/IP + sweeper). Guarda país e hash de IP (nunca la IP).
- Admin (auditado): `GET /api/admin/contact?limit&offset` → {total, unread, messages}; `POST /api/admin/contact/:id/read`; `DELETE /api/admin/contact/:id`. `/metrics` gana `contact.unread`.

**Web**: página **`/contacto`** (prerender, estilo /privacidad) con formulario — nombre/email opcionales, mensaje, estado de éxito; enlace "Contacto" en el footer del landing; la tarjeta de Contacto de /privacidad pasa de mailto a enlace a /contacto; pestaña "Contacto" en el panel.

## B — Valoraciones: estrellas + preguntas clave predefinidas

**Qué se pregunta** (selección única tipo chips, ~5 segundos de esfuerzo; distintas por rol porque viven experiencias distintas):

*Viewer:*
1. **Calidad de vídeo**: `Fluida` / `Con algunos cortes` / `Muy entrecortada`
2. **Entrada**: `Entré sin problemas` / `Tardé en conectar` / `No conseguí entrar a la primera`
3. **¿Recomendarías Wachaut?**: `Sí` / `Tal vez` / `No`

*Host:*
1. **Experiencia emitiendo**: `Fácil` / `Con dificultades` / `Frustrante`
2. **Estabilidad de tu conexión**: `Estable durante toda la emisión` / `Algunos cortes` / `Cortes constantes`
3. **¿Volverías a emitir?**: `Sí` / `Tal vez` / `No`

Y las **estrellas 1–5** + **comentario opcional** (≤500). Las preguntas sustituyen a los chips de problemas del plan anterior (redundantes) y su estructura fija permite agregación directa ("¿qué % de viewers tuvo cortes?" — oro para cruzar con Fiabilidad).

**Server**:
- Tabla `feedback (id, ts, room_id, role, rating 1-5, answers TEXT(JSON con claves y valores de los enums fijos), comment ≤500, visitor_id, ip_hash, country)`.
- `POST /api/feedback` público (rate-limit 10/min/IP): roomId, role, rating obligatorios; `answers` validado por esquema (solo claves/valores permitidos según rol, máx las 3); **dedupe** misma IP+sala+rol en 24h → 409 silencioso en cliente; sessionStorage `wachaut.rated.<roomId>`.
- Admin `GET /api/admin/feedback?days=7|30`: agregados calculados en servidor — nº, media, distribución 1–5, desglose host/viewer, y **por cada pregunta su distribución** (p.ej. vídeo: 70% fluida / 20% cortes / 10% entrecortada) + últimas 50 con comentario y sala.

**Web**:
- **`RatingCard.svelte`**: estrellas accesibles (lucide Star), las 3 preguntas del rol como filas de chips de selección única, comentario opcional, "Enviar"/"Omitir".
- **Host**: al confirmar "Terminar" en el modal de salida → modal de valoración (si no valoró) → enviar/omitir → inicio. (El simple stop-sharing no termina la sala → no puntúa.)
- **Viewer**: nuevo estado `'ended'` al recibir `room:closed` — pantalla "La retransmisión ha terminado" con la RatingCard y CTA "Volver al inicio" (antes caía en el error genérico con "Intentar de nuevo", absurdo tras un cierre). El grace del server garantiza `room:closed` también cuando el host no cierra bien.
- Correlación: roomId + visitor id en cada valoración → cruzable con Fiabilidad (¿los cortes percibidos coinciden con los cortes reales medidos?).

## C — Panel: página "Contacto" (`/admin/contacto`)

- **Mensajes**: KPI sin leer/total, lista (remitente, email, mensaje, país, hace cuánto, leído), marcar leído/no leído, eliminar con confirmación, paginación.
- **Valoraciones**: media con estrellas, barras de distribución 1–5, desglose host/viewer, **una fila de barras por cada pregunta clave** (respuesta → % y conteo), lista de últimas con comentario y sala. Selector 7/30 días.

## D — Tests, infra y despliegue

- `test/feedback.test.ts`: contacto (400s, 429, país+hash, admin read/delete auditado); valoraciones (validación de enums por rol — clave de viewer rechazada para host y viceversa —, dedupe 24h → 409, agregados correctos con datos sembrados incluida la distribución por pregunta).
- Dokploy prod: rutas `wachaut.com/api/contact` y `wachaut.com/api/feedback` → server (dev ya cubiertas por /api). Sin env nuevos.
- Typecheck + tests + build, commit (fallback gh api), deploy y verificación en prod: contacto y valoración reales visibles en el panel, flujo de estrellas/preguntas en sala de prueba.