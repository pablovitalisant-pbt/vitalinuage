# Especificación de Corrección de Formato de Tag v1.6.0

## 1. Definición del Problema
Es posible que la construcción actual de la variable `IMAGE_TAG` en el pipeline genere URLs con dobles slashes (`//`) si las variables secretas no están perfectamente sanitizadas o si la concatenación no es cuidadosa.
- **Riesgo:** Google Artifact Registry puede rechazar la imagen o fallar en el push si el formato no es canónico.

## 2. Estructura Requerida
La etiqueta de la imagen debe seguir rigurosamente el formato:
`REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY_ID/IMAGE_ID:TAG`

- **Regla de Concatenación:** Se debe asegurar que no haya un slash al final de `PROJECT_ID` o al inicio de `REPOSITORY_id` que, al unirse, forme `//`.
- **Formato Seguro:** Validar visualmente y sintácticamente la cadena de texto en el script de bash.

## 3. Corrección de Sintaxis
Revisar la definición en `pipeline.yml`:
```yaml
IMAGE_TAG="us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/${{ secrets.GCP_REPOSITORY }}/vitalinuage-backend:${{ github.sha }}"
```
Aunque parece correcta, el criterio de calidad exige blindaje.

## 4. Criterios de Aceptación
1. **Validación de Integridad:** El script `tests/test_pipeline_integrity.py` debe ser actualizado para buscar explícitamente patrones de doble slash (`//`) dentro de la definición de `IMAGE_TAG` (excluyendo el protocolo `https://` que no aplica aquí).
2. **Formato Limpio:** La cadena resultante no debe contener `//` intermedios.
