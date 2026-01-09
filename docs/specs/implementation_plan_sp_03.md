### [PROTOCOLO PBT-IA] - SLICE [20] - FASE A & B: VALIDACIÓN y REFACTORIZACIÓN

**1. DIAGNÓSTICO FINAL (FASE A):**
- **Test Rojo (Fase B):** `backend/tests/test_onboarding_status.py` **PASÓ** (Verde). Esto indica que la lógica de persistencia es correcta a nivel código/ORM en un entorno ideal.
- **Causa del Loop:** El endpoint `GET /profile` retorna `{"has_profile": False}` si el usuario no ha completado el onboarding. Esto hace que el Frontend descarte cualquier dato parcial y reinicie el flujo. Si el usuario refresca o navega, el Frontend ve `has_profile: False` y resetea el estado local `isOnboarded` a `false` (o default), causando que el Guard lo redirija de nuevo al onboarding si intenta ir al dashboard.

**2. PROPUESTA DE CAMBIO (ESTRATEGIA):**
En lugar de ocultar el perfil hasta que esté "completo", cambiaremos la arquitectura para ser **State-Aware**.

- **Backend (`GET /api/doctors/profile`):**
    - Eliminar el bloqueo `if not is_onboarded: return {"has_profile": False}`.
    - Retornar **siempre** el objeto `DoctorProfile`.
    - Si `is_onboarded` es `False`, el JSON devolverá `isOnboarded: false` pero incluirá nombre, email, etc.
    
- **Frontend (`DoctorContext.tsx`):**
    - Eliminar la lógica `if (data.has_profile === false)`.
    - Consumir siempre el perfil devuelto. La propiedad `isOnboarded` será la única fuente de verdad para el `OnboardingGuard`.

**3. PLAN DE EJECUCIÓN (FASE C):**
1. **PASO_01 (BACKEND):** Modificar `backend/api/doctor.py` para eliminar la validación de `is_onboarded` en el endpoint `get_profile`.
2. **PASO_02 (FRONTEND):** Actualizar `frontend/src/context/DoctorContext.tsx` para eliminar el chequeo de `has_profile` y usar siempre los datos del backend.

**ENTREGABLE:** Diff de Backend y Frontend eliminando la lógica de "perfil inexistente".
