# Slice NC-01 — Patient Info (Contrato)

## Objetivo
En `/patient/:id/new-consultation`, la tarjeta **Información del Paciente** muestra datos reales del paciente usando `patientId` de la ruta.

## Fuente/Endpoint
- Endpoint existente: `GET /api/patients/{id}` (mismo patrón usado en `PatientProfile`).

## Campos requeridos (si existen en respuesta)
- Nombre completo (nombre + apellidos)
- Edad (calculada desde `fecha_nacimiento`)
- Sexo
- RUT/DNI (`dni`)
- Teléfono
- Nacionalidad
- Domicilio (`direccion`)
- Comuna

## Estados de UI
- Loading: muestra `Cargando...` en campos.
- Error: muestra mensaje de error (sin romper layout).
- Faltantes: muestran `—` (no `N/D`).

## Criterios de aceptación
1. Con un paciente real, los campos se muestran con datos reales.
2. Si un campo no existe, se muestra `—` sin romper la card.
3. No se modifica el layout global (sidebar/topbar).
