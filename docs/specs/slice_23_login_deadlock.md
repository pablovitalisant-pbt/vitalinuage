# Slice 23: Rescate de Carga Silenciosa (Login Deadlock + Latency)

## 1. DIAGNÓSTICO
**Síntoma:** Pantalla "Procesando..." infinita o bloqueada en redes lentas/servidores dormidos.
**Causa Raíz:** Falta de timeouts explícitos y manejo de excepciones en `DoctorContext`. Falta de feedback visual durante esperas largas (Server Wakeup).

## 2. CONTRATO DE ESTABILIDAD
**Garantía de Salida:**
1.  `isLoading` DEBE pasar a `false` SIEMPRE, máximo a los 12 segundos.
2.  Si la espera supera los 7 segundos, se debe informar al usuario.

**Mecanismo:**
- `try...catch...finally` obligatorio.
- `AbortController` con timeout de 12s.
- Feedback visual intermedio (no solo spinner).

## 3. CRITERIOS DE ACEPTACIÓN
- [ ] **Timeout de Seguridad:** Si el servidor no responde en 12s, cancelar y liberar UI.
- [ ] **Feedback Latencia:** A los 7s, mostrar "Despertando servidor...".
- [ ] **Logs:** Registrar tiempo exacto de ejecución en consola.
- [ ] **Limpieza:** `isLoading` es false al finalizar, pase lo que pase.
