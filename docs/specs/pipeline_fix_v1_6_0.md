# Especificación de Reparación de Pipeline v1.6.0

## 1. Definición del Problema
El proceso de construcción en CI (`docker build`) falla debido a una discrepancia en el contexto de archivos.
- **Síntoma:** Error `COPY failed: file not found in build context or excluded by .dockerignore: stat backend/requirements.txt: file does not exist`.
- **Causa Raíz:** El comando de construcción podría estar ejecutándose dentro de una subcarpeta o el Dockerfile espera una ruta relativa (`backend/`) que no coincide con el contexto proporcionado.

## 2. Contrato de Contexto
El comando `docker build` **DEBE** ejecutarse estrictamente desde la **raíz del repositorio** (`.`).
- Esto asegura que la referencia `COPY backend/requirements.txt .` dentro del Dockerfile sea válida, ya que la carpeta `backend` es visible desde la raíz.

## 3. Contrato de Ubicación
El archivo `Dockerfile` no se encuentra en la raíz, sino dentro de `backend/` (o así se asume para esta corrección si fuese el caso, pero basado en la inspección previa estaba en raíz. *Nota: Si el usuario indica "backend/Dockerfile", se ajustará el comando*).
- **Corrección:** Si el Dockerfile se ha movido o se debe referenciar explícitamente, el comando debe usar la flag `-f`:
  ```bash
  docker build -f backend/Dockerfile .
  ```
  *(Si el Dockerfile sigue en la raíz, simplemente se ejecuta desde raíz, pero la especificación pide referenciarlo explícitamente como `backend/Dockerfile` por requisitos del usuario).*

## 4. Criterios de Aceptación
1. **Resolución de Rutas:** El paso de construcción del pipeline no debe fallar buscando `requirements.txt`.
2. **Inmutabilidad de Archivos:** No se permite mover `requirements.txt` ni otros archivos fuente para "facilitar" la construcción. La estructura del repositorio es sagrada.
3. **Checksum Válido:** El hash del archivo copiado debe coincidir, asegurando que es el archivo correcto.
