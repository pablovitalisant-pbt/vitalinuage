# 03 Frontend Tenant Awareness Specification

## 1. Objetivo
Integrar el frontend con el backend multitenant implementado en el Slice 02. Esto implica enviar el token de autenticación (JWT) en todas las peticiones de pacientes para que el backend pueda identificar al `owner_id` y filtrar los datos correctamente. Además, se creará un componente `Dashboard` (o se actualizará la vista principal) para reflejar esta lista filtrada.

## 2. Archivos Afectados

### Frontend
*   `frontend/src/services/patientService.ts` (Nuevo): Centraliza las llamadas API de pacientes (`fetchPatients`, `searchPatients`, `createPatient`). Inyecta el header `Authorization`.
*   `frontend/src/context/DoctorContext.tsx` (Revisión): Asegurar que exponga el `token` o un método para obtenerlo.
*   `frontend/src/components/Dashboard.tsx` (Nuevo/Modificación): Componente principal que listará los pacientes. Usará `patientService`.
*   `frontend/src/pages/Search.tsx`: Refactorizar para usar `patientService` en lugar de `fetch` directo.
*   `frontend/src/hooks/usePatients.ts` (Nuevo): Hook para manejar el estado de carga y error al obtener pacientes, integrando el Feature Flag.

## 3. Especificación Técnica

### 3.1 `patientService.ts` (Servicio Centralizado)
Crear este archivo para manejar la comunicación HTTP.
```typescript
const API_URL = '/api/pacientes';

export const patientService = {
  getAll: async (token: string) => {
    const res = await fetch(API_URL, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error fetching patients');
    return res.json();
  },
  search: async (token: string, query: string) => {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
       headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  create: async (token: string, data: any) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
```

### 3.2 `usePatients.ts` (Hook Lógico)
Hook que abstrae la carga de pacientes y el manejo del flag `enable_multitenancy`.
Si `enable_multitenancy` es `false` (según configuración hardcoded o fetchada), ¿qué hacemos? 
*   Suposición: El backend YA exige auth. El flag en frontend podría usarse para mostrar UI alternativa o advertencias.
*   Lógica: Llamará a `patientService.getAll(token)`.
*   Manejará estados: `loading`, `error`, `patients` (lista), `isEmpty`.

### 3.3 `Dashboard.tsx` (Componente Visual)
Este componente mostrará "Mis Pacientes".
*   Si `loading`: Spinner.
*   Si `isEmpty`: Mensaje "No tienes pacientes asignados. Registra el primero." (Importante para Multitenancy, ya que al inicio la lista estará vacía para cada médico).
*   Si `patients`: Renderizar lista/tarjetas.

### 3.4 Integration in `SearchPage` (o nueva Home)
Actualmente `SearchPage` (`/search`) es la principal.
Refactorizar `SearchPage` para que use `usePatients` (o el servicio `search`) e incluya el token.

## 4. Feature Flags
Se leerá `enable_multitenancy` de un archivo de configuración frontend (`src/config.ts` o simular lectura de `feature-flags.json`).
*   Si `false`: Podría mostrar un aviso "Modo compatibilidad global" o comportarse igual (dado que el backend manda). Por consistencia con el backend, asumiremos `true` para la integración o que el flag solo controla características UI extra.
*   *Decisión*: En este slice, asumimos que el backend FORZA multitenancy. El flag en frontend será principalmente para "toggles" visuales si fueran necesarios, pero la inyección de token es mandatoria.

## 5. Plan de Pruebas (Fase B)
*   Unit Test (`patientService`): Mock fetch y verificar header Authorization.
*   Integration Test: Renderizar `Dashboard` con un mock de `DoctorContext` (token) y verificar que llama al servicio y muestra datos/vacío.

## 6. Preguntas
*   ¿El token JWT está disponible en `DoctorContext`? (Pendiente verificar en paso previo, asumimos que sí o hay que exponerlo).
