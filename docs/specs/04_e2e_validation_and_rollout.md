# 04 E2E Validation and Rollout Specification

## 1. Objetivo
Validar el sistema completo (Frontend + Backend + DB) en un escenario realista de uso simultáneo por múltiples doctores (Multitenancy). Tras la validación exitosa, activar oficialmente la funcionalidad mediante Feature Flag.

## 2. Archivos Afectados
*   `tests/e2e/test_multitenancy_flow.py` (Nuevo): Script de prueba E2E que simula el flujo completo.
*   `config/feature-flags.json`: Cambio de estado del flag `enable_multitenancy`.

## 3. Escenario de Prueba E2E
El script debe ejecutar los siguientes pasos de manera automatizada:

### Setup
1.  **Registrar Médico A** (`medicoA@test.com`) y **Médico B** (`medicoB@test.com`) mediante endpoint `/register`.
2.  **Login Médico A**: Obtener Token A.
3.  **Login Médico B**: Obtener Token B.

### Acción 1: Médico A trabaja
1.  Médico A crea un paciente "Paciente de A" (POST `/api/pacientes`).
2.  Médico A lista sus pacientes (GET `/api/pacientes`).
3.  **Assert**: La lista contiene "Paciente de A".

### Acción 2: Aislamiento (Médico B verifica)
1.  Médico B lista sus pacientes (GET `/api/pacientes`).
2.  **Assert**: La lista está **VACÍA** (o no contiene "Paciente de A").
3.  Médico B crea su propio paciente "Paciente de B".
4.  Médico B lista sus pacientes.
5.  **Assert**: La lista contiene SOLO "Paciente de B".

### Teardown (Cleanup)
*   Borrar usuarios y pacientes de prueba de la BD (si es posible, o usar DB transaccional de test).

## 4. Estrategia de Rollout
Una vez pasado el E2E:
1.  Modificar `config/feature-flags.json`.
2.  Establecer `"enable_multitenancy": true`.
3.  Commit final indicando "Release".

## 5. Criterios de Aceptación
> [!IMPORTANT]
> El sistema solo se considera "Listo para Producción" si:
> 1. El test E2E pasa en verde consistentemente.
> 2. No se detectan fugas de datos (Médico B viendo datos de A).
> 3. El Feature Flag está activo.

## 6. Consideraciones Técnicas
*   El test E2E usará `requests` y atacará al servidor local (`localhost:8000`) que debe estar corriendo.
*   Se requerirán funciones helper para `register` y `login` en el test.
