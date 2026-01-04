# 05.1 Auth Polish & Persistence Specification

## 1. Contexto
En el entorno de producción (Firebase), la experiencia de usuario debe ser robusta frente a recargas de página y expiración de sesiones. Actualmente, la gestión del token reside en `DoctorContext`, pero debemos garantizar que la redirección a `/login` sea inmediata y sin "flashes" de contenido protegido si no hay sesión.

## 2. Análisis del Estado Actual
*   **Token Persistence:** `DoctorContext` inicializa su estado leyendo `localStorage`.
*   **Redirección:** Actualmente se maneja de forma ad-hoc o mediante comprobaciones en `usePatients` o componentes individuales. Falta un guardián centralizado (`ProtectedRoute`).

## 3. Propuesta de Implementación: `ProtectedRoute`
Crear un componente wrapper que verifique la autenticación antes de renderizar rutas protegidas.

```tsx
// Esquema conceptual
const ProtectedRoute = ({ children }) => {
  const { token } = useDoctor();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};
```

## 4. Escenarios de Prueba (Criterios de Aceptación)

### 4.1. Pruebas Manuales (Browser Verification)
1.  **Persistencia en Recarga:**
    *   **Acción:** Login exitoso -> Navegar al Dashboard -> Recargar página (F5).
    *   **Resultado Esperado:** El usuario permanece en el Dashboard. El nombre del doctor sigue visible. No hay redirección al Login.

2.  **Redirección por Falta de Token:**
    *   **Acción:** Estando logueado, borrar manualmente el token de `localStorage` (Application Tab) -> Recargar.
    *   **Resultado Esperado:** Redirección inmediata a `/login`.

3.  **Acceso Directo no Autorizado:**
    *   **Acción:** En una sesión de incógnito, intentar acceder a `/dashboard` directamente.
    *   **Resultado Esperado:** Redirección inmediata a `/login`.

### 4.2. Pruebas Automáticas (Unit/Integration)
*   **`Authentication.test.tsx` (Nuevo):**
    *   Test 1: Renderizar `ProtectedRoute` sin token -> Verifica redirección a `/login`.
    *   Test 2: Renderizar `ProtectedRoute` con token -> Verifica renderizado de componentes hijos.

## 5. Plan de Rollout
1.  Implementar `components/layout/ProtectedRoute.tsx`.
2.  Refactorizar `App.tsx` para envolver rutas privadas (`/dashboard`, `/profile`, `/register-patient`, etc.) con este componente.
3.  Desplegar a Preview Channel para validación.
