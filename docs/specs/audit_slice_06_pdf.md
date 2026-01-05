# Auditoría Técnica: Motor de PDF (Slice 06)

## 1. Localización de Activos Existentes
Se han identificado los siguientes componentes en el codebase actual:

### Backend
*   **Templates (`backend/pdf_templates.py`):** Contiene 3 plantillas HTML/Jinja2 (`MINIMAL`, `MODERN`, `CLASSIC`) con estilos CSS para tamaño A5 y lógica de renderizado (placeholders para doctor, paciente, consulta).
*   **Font Helper (`backend/copy_system_fonts.py`):** Script de utilidad para gestión de fuentes (sugiere uso de `WeasyPrint` o librería sensible a fuentes).
*   **Tests (`backend/tests/test_prescription_map.py`):** Referencia a un endpoint `/api/maps` no implementado actualmente.
*   **Ausencias:** No se encontró un servicio de generación (`generate_pdf`) ni endpoints activos (`/api/print`) en `main.py` o `services/`.

### Frontend
*   **Configuración UI (`frontend/src/components/PrintSettingsModal.tsx`):** Componente funcional para seleccionar plantilla, tamaño de papel y subir logo. Usa un contexto `DoctorContext`.
*   **Contrato (`frontend/src/contracts/receta.ts`):** Esquema Zod definiendo la estructura de receta (medicamentos, dosis, etc.).

## 2. Análisis del Motor PDF
*   **Tecnología Implícita:** Las plantillas usan sintaxis Jinja2 y CSS `@page` (Paginado). Esto es compatible idealmente con **WeasyPrint** (Python) para un renderizado fiel al HTML/CSS.
*   **Lógica de Ajuste:** Actualmente el frontend permite elegir plantilla y tamaño. La lógica de "escanear/ajustar coordenadas" mencionada en los tests parece ser una característica "planned" (visual map editor) pero no implementada en el backend activo.

## 3. Gap Analysis: Consulta -> Receta
Existe una desconexión entre el registro de la Consulta Clínica (Slice 09.2) y este motor de impresión (Slice 06).

| Requerimiento | Estado Actual | Propuesta |
|---|---|---|
| **Datos de Entrada** | `ClinicalConsultation` tiene texto libre (`plan_tratamiento`). | Motor requiere estructura estructurada o mapeo del texto libre al área de tratamiento. |
| **Generación PDF** | Templates existen, pero no hay función que los llene y renderice. | Implementar `PDFService` con `WeasyPrint`. |
| **Endpoint** | No existe endpoint para imprimir consulta. | Crear `GET /api/print/consultation/{id}`. |
| **Persistencia** | Las recetas no se guardan como entidad separada, se derivan de la consulta. | (Fase 1) Generar PDF al vuelo desde la consulta. |

## 4. Propuesta de Contrato (Fase A)

Dado que los templates ya esperan recibir objetos `doctor`, `patient` y `consultation`, el contrato se centrará en el servicio de generación.

### Nuevo Servicio: `PDFService` (Backend)
Encargado de:
1. Recibir ID de Consulta + Configuración (Template ID).
2. Hidratar el Template Jinja2 con datos de la DB.
3. Renderizar a PDF usando WeasyPrint.
4. Retornar `StreamingResponse` (Blob PDF).

### Endpoint Propuesto
`GET /api/consultas/{id}/pdf`
*   **Query Params:** `template` (minimal, modern, classic), `paper_size` (A4, A5).
*   **Response:** `application/pdf`.

### Integración Frontend
1. En `ConsultationManager` o `PatientProfile`, añadir botón "Imprimir Receta" en cada consulta histórica.
2. Este botón abre `PrintSettingsModal`.
3. Al confirmar en el modal, se llama a `window.open('/api/consultas/{id}/pdf?template=...')`.
