# SLICE 16 - Firma y Sello Digital - Resumen de Implementación

**Estado:** Completado
**Descripción:** Implementación de firma digitalizada en recetas.

**Backend:**
- Actualizado `DoctorPreferences` para incluir `signature_path`.
- Nuevo endpoint `POST /api/doctor/signature` para subir imágenes de firma.
- Actualizada lógica de PDF (`main.py`) para incrustar la firma como imagen Base64 si existe.
- Soporte para campo especial `doctor_signature` en el motor de renderizado.

**Frontend:**
- **Perfil de Médico:** Nueva sección para previsualizar y subir la imagen de la firma.
- **Calibrador de Talonario:** Nuevo campo arrastrable "Firma y Sello".
- **Lógica de Fusión:** El calibrador ahora fusiona campos nuevos (como la firma) con mapas guardados anteriormente, asegurando que aparezcan sin borrar la configuración previa.

**Flujo de Usuario:**
1. Médico sube su firma en `/settings` -> Perfil.
2. Médico va a `/settings/talonario`, ve el nuevo campo "Firma y Sello", y lo coloca en el lugar deseado.
3. Al imprimir, la firma aparece en la posición exacta. Si no hay firma subida, el espacio queda en blanco.
