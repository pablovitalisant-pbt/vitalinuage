# 05.2 Patient Registry UI & API Feedback Specification

## 1. Contexto
La página de registro de pacientes (`RegisterPatient.tsx`) funciona funcionalmente pero carece de feedback visual adecuado. El usuario no sabe si la petición se está procesando o si ocurrió un error específico.

## 2. Requerimientos de UX/UI
### 2.1. Estados de Carga
*   **Trigger:** Al hacer click en "Registrar Paciente".
*   **Comportamiento Visual:**
    *   Deshabilitar el botón "Registrar Paciente".
    *   Cambiar texto de botón a "Guardando..." (o spinner).
    *   Bloquear inputs del formulario (opcional, por ahora solo botón).

### 2.2. Notificaciones (Toasts)
*   **Librería Elegida:** `react-hot-toast` (Ligera, fácil integración).
*   **Casos:**
    *   **Éxito:** "Paciente registrado correctamente". Icono verde.
    *   **Error 500:** "Error del servidor. Intente más tarde".
    *   **Error 409 (Conflicto/Duplicado):** "El paciente ya existe (DNI duplicado?)".
    *   **Error Conexión:** "Error de conexión. Verifique su internet".

### 2.3. Post-Registro
*   Limpiar el formulario (`reset()`) tras un éxito.
*   Mantener los datos en el formulario tras un error para permitir corrección.

## 3. Propuesta de Implementación

### 3.1. Modificaciones en `usePatients.ts`
El hook `createPatient` debe exponer un estado de carga local o devolver una promesa que permita a la UI manejar el estado.
Actualmente `createPatient` ya es async.
Se añadirá `react-hot-toast` al proyecto.

### 3.2. Modificaciones en `RegisterPatient.tsx`
*   Inyectar `Toaster` en el Layout o App root (idealmente) o localmente por ahora.
*   En `onSubmit`:
    1.  Activar `isSubmitting`.
    2.  Llamar a `createPatient`.
    3.  En `try`: `toast.success()`, `reset()`.
    4.  En `catch`: `toast.error()`.
    5.  `finally`: Desactivar `isSubmitting`.

## 4. Dependencias Nuevas
*   `react-hot-toast`

## 5. Escenarios de Prueba
### Manuales
1.  **Registro Exitoso:** Llenar datos válidos -> Toast Verde -> Formulario limpio -> Botón habilitado.
2.  **Error Server:** Simular fallo (apagar backend o interceptar red) -> Toast Rojo.
3.  **Doble Click:** Verificar que el botón se deshabilia inmediatamente para evitar doble envío.
