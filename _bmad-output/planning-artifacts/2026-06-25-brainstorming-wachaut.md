# Brainstorming Wachaut — BMAD Session
> Fecha: 2026-06-25 | Equipo: Product Analyst + UX Designer + Technical Architect

---

## 🎯 Resumen Ejecutivo

**Wachaut tiene la base correcta** (P2P, sin registro, simple, rápido) pero le faltan las features que definen si alguien USARÁ el producto o buscará otra cosa.

### Veredicto del equipo:
| Rol | Diagnóstico |
|-----|------------|
| **Producto** | "El anti-Zoom para casos de 5 minutos". Falta audio, chat, y un límite de viewers razonable |
| **UX** | Flujo claro pero el "primer momento mágico" tiene fricción. Falta celebración, onboarding, feedback |
| **Arquitectura** | Sólida para MVP. Sin TURN (~15% usuarios fallan), sin auth, sin rate limiting |

---

## 🔥 TOP 5 PRIORIDADES (consenso entre los 3 agentes)

### 1. 🔊 Audio integrado (voice chat P2P)
- **Impacto:** ⭐⭐⭐⭐⭐ | **Esfuerzo:** Medio (3-5 días)
- Sin audio, Wachaut es un "viewer pasivo" — reemplazable
- Con audio se convierte en herramienta de comunicación real
- Implementar via WebRTC audio tracks + data channel para mute/unmute

### 2. 💬 Chat textual en sala
- **Impacto:** ⭐⭐⭐⭐⭐ | **Esfuerzo:** Bajo (2-3 días)
- Socket.IO ya existe para signaling — extender para chat
- WebRTC data channel como alternativa P2P
- Los viewers necesitan comunicarse ("¿Puedes hacer scroll?", "Más a la izquierda")

### 3. 🎉 Reacciones/emojis del viewer
- **Impacto:** ⭐⭐⭐⭐ | **Esfuerzo:** Bajo (1 día)
- 👍👎❓ en tiempo real sin chat completo
- Viral porque es shareable
- WebRTC data channel o Socket.IO

### 4. 🔒 Servidor TURN (Coturn)
- **Impacto:** ⭐⭐⭐⭐⭐ | **Esfuerzo:** Medio (4-8h)
- Sin TURN, ~15-20% de usuarios NO podrán conectarse (NAT simétrico, firewalls corporativos, VPNs)
- Coturn en Docker → Dokploy
- Credenciales temporales por sesión

### 5. 🛡️ Rate limiting + Room IDs seguros
- **Impacto:** ⭐⭐⭐⭐ | **Esfuerzo:** Bajo (3-5h)
- Sin rate limiting = DDoS trivial
- Room IDs actuales son UUIDs (secuables si se adivina el patrón)
- Validación en server + client

---

## 📊 Features Ranking Completo

### 🟢 QUICK WINS ( Alto impacto / Bajo esfuerzo )

| # | Feature | Impacto | Esfuerzo | Días |
|---|---------|---------|----------|------|
| 1 | Renombrar "Crear sala" → "Compartir mi pantalla" | ⭐5 | ⭐1 | 0.1 |
| 2 | Feedback de copiado mejorado (scale-in + vibración) | ⭐4 | ⭐1 | 0.2 |
| 3 | Indicador de estado del viewer (conectando→listo) | ⭐5 | ⭐2 | 0.5 |
| 4 | Badge "En vivo" con pulso animado | ⭐4 | ⭐1 | 0.1 |
| 5 | Toast de reconexión automática | ⭐5 | ⭐2 | 0.5 |
| 6 | Reacciones/emojis del viewer | ⭐4 | ⭐1 | 1 |
| 7 | Botón copiar link + OG tags para preview en redes | ⭐4 | ⭐1 | 0.5 |

### 🟡 MEDIUM WINS (Alto impacto / Esfuerzo medio)

| # | Feature | Impacto | Esfuerzo | Días |
|---|---------|---------|----------|------|
| 8 | Chat textual en sala | ⭐5 | ⭐2 | 2-3 |
| 9 | Audio integrado (voice chat P2P) | ⭐5 | ⭐3 | 3-5 |
| 10 | Onboarding de 3 pasos (overlay首次) | ⭐5 | ⭐3 | 2 |
| 11 | Celebración del primer viewer | ⭐4 | ⭐2 | 1 |
| 12 | Indicador de calidad de conexión | ⭐4 | ⭐3 | 2 |
| 13 | Web Share API (share nativo del móvil) | ⭐4 | ⭐2 | 1 |
| 14 | Grabación local (MediaRecorder) | ⭐3 | ⭐2 | 2 |
| 15 | Aumentar viewers a 20-50 | ⭐4 | ⭐2 | 1 |
| 16 | Servidor TURN (Coturn) | ⭐5 | ⭐3 | 2-3 |
| 17 | Rate limiting en Socket.IO | ⭐4 | ⭐1 | 0.5 |

### 🔴 STRATEGIC (Alto impacto / Alto esfuerzo)

| # | Feature | Impacto | Esfuerzo | Días |
|---|---------|---------|----------|------|
| 18 | Rooms persistentes/personales | ⭐4 | ⭐3 | 3-5 |
| 19 | Anotaciones/dibujo overlay | ⭐4 | ⭐4 | 5-8 |
| 20 | Modo PiP automático para viewer | ⭐4 | ⭐4 | 3-5 |
| 21 | Control remoto (viewer controla host) | ⭐5 | ⭐5 | 10-15 |
| 22 | Pizarrón blanco compartido | ⭐4 | ⭐5 | 10-15 |
| 23 | Migración a SFU (mediasoup/LiveKit) | ⭐4 | ⭐5 | 15-20 |

---

## 🏗️ Arquitectura: Límites del Mesh P2P

| Viewers | Conexiones | Upload/peer | Estado |
|---------|-----------|-------------|--------|
| 1-2 | 1 | 1 stream | ✅ Perfecto |
| 3-4 | 3-6 | 2-3 streams | ✅ Excelente |
| 5-6 | 10-15 | 4-5 streams | ⚠️ Límite práctico |
| 7-10 | 21-45 | 6-9 streams | 🔴 Calidad degrada |
| 10+ | 45+ | 10+ streams | 🔴 Inutilizable |

**Próximo salto arquitectónico:** SFU cuando se necesite 1→N viewers (50+)

---

## 🎨 UX: Momentos Mágicos Propuestos

1. **"Un click y magia"** — Botón "Compartir mi pantalla" crea sala en background
2. **Onboarding de 3 segundos** — Overlay animado con 3 pasos visuales
3. **Estado "Esperando primer viewer"** — Overlay amigable con pulsación animada
4. **Celebración del primer viewer** — Confetti sutil o scale-in del video
5. **Quality indicator** — Mini-badge verde/amarillo/rojo con stats de conexión

---

## 🛣️ Roadmap Propuesto

### Fase 1: "De visualización a conversación" (Semanas 1-2)
- [ ] Audio integrado P2P
- [ ] Chat textual básico
- [ ] Reacciones/emojis
- [ ] Quick UX wins (renombrar CTA, feedback copiado, badge animado)

### Fase 2: "Infraestructura sólida" (Semanas 3-4)
- [ ] Servidor TURN (Coturn)
- [ ] Rate limiting
- [ ] Room IDs seguros
- [ ] Reconexión automática
- [ ] Health checks

### Fase 3: "Retención y magia" (Semanas 5-8)
- [ ] Onboarding de 3 pasos
- [ ] Celebración del primer viewer
- [ ] Grabación local
- [ ] Web Share API
- [ ] Indicador de calidad de conexión
- [ ] Rooms persistentes

### Fase 4: "Monetización" (Semanas 9-12)
- [ ] Tier Free vs Pro
- [ ] Anotaciones básicas
- [ ] Analytics de sesiones
- [ ] Landing optimizada (SEO)

---

## 💡 Insight Estratégico

> **Wachaut NO debería intentar ser Zoom. Debería ser "el anti-Zoom" para casos de uso de 5 minutos.**

El mercado real no es "reuniones de 1 hora" — es **"mira esto rápido en mi pantalla"**. Es el equivalente digital de girar la laptop hacia alguien.

Competidores más peligrosos: Screenz, PeaStream, Screencastr, Dead Simple Screen Sharing — todos tienen audio y chat que Wachaut no tiene.

**La prioridad absoluta #1 es agregar audio integrado.** Todo lo demás es secundario hasta que eso exista.
