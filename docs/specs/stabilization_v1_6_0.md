# Especificación de Estabilización v1.6.0

## 1. Contexto del Problema
Se ha detectado una regresión estructural crítica en el despliegue de la versión v1.6.0 de Vitalinuage.
- **Fallo de Namespace:** La instrucción `COPY backend/ .` en el `Dockerfile` destruye la estructura de directorios, moviendo el contenido de `backend` a la raíz. Esto rompe todos los imports absolutos del tipo `from backend...`, causando `ModuleNotFoundError`.
- **Fallo de Dependencias:** El entorno carece de `libgobject-2.0-0`, una librería esencial para el funcionamiento de WeasyPrint (motor de PDF), lo que provocaría fallos en tiempo de ejecución (Error 500) incluso si la aplicación arrancara.

## 2. Requisitos de Estructura (Namespace)
El proceso de construcción del contenedor **DEBE** preservar la jerarquía del paquete `backend`.

- **Cambio Requerido:** Modificar la instrucción de copia en el `Dockerfile`.
- **Estado Actual (Erróneo):**
  ```dockerfile
  COPY backend/ .
  ```
- **Estado Objetivo (Correcto):**
  ```dockerfile
  COPY backend/ ./backend/
  ```
- **Justificación:** Esto asegura que `/app/backend/main.py` exista, permitiendo que Python resuelva correctamente el paquete `backend` como raíz de los imports.

## 3. Requisitos de Sistema (Librerías)
El contenedor **DEBE** instalar las dependencias de sistema requeridas para GObject y Pango.

- **Cambio Requerido:** Añadir `libgobject-2.0-0` a la lista de `apt-get install`.
- **Lista de Dependencias Target:**
  - `libcairo2`
  - `libpango-1.0-0`
  - `libpangocairo-1.0-0`
  - `libgdk-pixbuf-2.0-0`
  - `libffi-dev`
  - `shared-mime-info`
  - **`libgobject-2.0-0` (NUEVO)**

## 4. Criterios de Aceptación

### Criterio A: Integridad del Import
La imagen Docker construida debe permitir la importación del módulo principal sin errores.
- **Prueba:** Ejecutar `python -c "import backend.main"` dentro del contenedor.
- **Resultado Esperado:** Código de salida 0 (sin excepciones `ModuleNotFoundError`).

### Criterio B: Integridad de WeasyPrint
El entorno debe tener todas las librerías compartidas enlazadas correctamente.
- **Prueba:** El binario de Python debe poder cargar las librerías gráficas.
- **Resultado Esperado:** Ausencia de errores `OSError: dlopen() failed` relacionados con GObject o Pango durante la inicialización de WeasyPrint.
