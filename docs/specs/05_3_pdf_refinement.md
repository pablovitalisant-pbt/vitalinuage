# Slice 05.3: PDF Prescription Refinement - Specification

## 1. Contexto Actual

El sistema actualmente genera recetas médicas en PDF, pero requiere mejoras estéticas y funcionales para alcanzar un nivel profesional comparable a recetas médicas reales.

## 2. Objetivos

### 2.1. Mejoras Estéticas
Diseñar un layout profesional que incluya:

1. **Cabecera Profesional**
   - Logo de la clínica/consultorio (opcional, configurable)
   - Nombre completo del médico
   - Especialidad
   - Número de matrícula profesional
   - Dirección del consultorio
   - Teléfono de contacto
   - Email profesional

2. **Información del Paciente**
   - Nombre completo
   - Edad / Fecha de nacimiento
   - DNI
   - Fecha de emisión de la receta
   - Número de receta (opcional)

3. **Cuerpo de la Receta**
   - Tabla limpia y legible para medicamentos con columnas:
     - Medicamento (nombre genérico y comercial)
     - Presentación (mg, ml, etc.)
     - Dosis
     - Frecuencia
     - Duración del tratamiento
   - Indicaciones adicionales (texto libre)
   - Diagnóstico (opcional)

4. **Pie de Página**
   - Línea para firma del médico
   - Fecha de emisión
   - Sello profesional (espacio reservado)
   - Texto legal si aplica (ej: "Receta válida por 30 días")

### 2.2. Mejoras Funcionales

1. **Nombre de Archivo Dinámico**
   - Formato: `Receta_[NombrePaciente]_[Fecha].pdf`
   - Ejemplo: `Receta_JuanPerez_2026-01-04.pdf`
   - Sanitizar nombre (eliminar caracteres especiales)

2. **Metadatos del PDF**
   - Título: "Receta Médica - [Nombre Paciente]"
   - Autor: [Nombre del Médico]
   - Fecha de creación

3. **Opciones de Diseño**
   - Plantilla "Clásica" (formal, serif)
   - Plantilla "Moderna" (limpia, sans-serif)
   - Plantilla "Minimalista" (solo esencial)

## 3. Diseño Visual Propuesto

### Layout "Clásica"

```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO]          CONSULTORIO MÉDICO                         │
│                  Dr. [Nombre Completo]                      │
│                  [Especialidad]                             │
│                  Mat. Prof.: [Número]                       │
│                  [Dirección] | Tel: [Teléfono]              │
├─────────────────────────────────────────────────────────────┤
│  Paciente: [Nombre Completo]        Edad: [XX años]        │
│  DNI: [XXXXXXXX]                    Fecha: [DD/MM/AAAA]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Rp/ (Prescripción)                                        │
│                                                             │
│  ┌──────────────┬─────────┬──────────┬──────────┐         │
│  │ Medicamento  │ Present.│  Dosis   │Frecuencia│         │
│  ├──────────────┼─────────┼──────────┼──────────┤         │
│  │ Ibuprofeno   │ 600mg   │ 1 comp.  │ c/8hs    │         │
│  │ Amoxicilina  │ 500mg   │ 1 cáps.  │ c/12hs   │         │
│  └──────────────┴─────────┴──────────┴──────────┘         │
│                                                             │
│  Indicaciones:                                             │
│  [Texto libre con instrucciones adicionales]              │
│                                                             │
│  Diagnóstico: [Opcional]                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Firma: _____________________                              │
│                                                             │
│  Dr. [Nombre]                        Fecha: [DD/MM/AAAA]   │
│  Mat. Prof.: [Número]                                      │
│                                                             │
│  [Espacio para sello]                                      │
│                                                             │
│  * Receta válida por 30 días desde su emisión             │
└─────────────────────────────────────────────────────────────┘
```

### Paleta de Colores

**Clásica:**
- Cabecera: Azul oscuro (#1e3a8a)
- Texto principal: Negro (#000000)
- Bordes: Gris medio (#64748b)
- Fondo: Blanco (#ffffff)

**Moderna:**
- Cabecera: Gradiente azul (#3b82f6 → #1e40af)
- Texto principal: Gris oscuro (#1f2937)
- Acentos: Verde médico (#10b981)
- Fondo: Blanco puro

**Minimalista:**
- Todo en escala de grises
- Énfasis en tipografía
- Espacios en blanco generosos

## 4. Tipografía

- **Cabecera:** 
  - Clásica: Georgia, serif (14-16pt)
  - Moderna: Inter, sans-serif (14-16pt)
  - Minimalista: Helvetica, sans-serif (12-14pt)

- **Cuerpo:**
  - Todas: 10-12pt
  - Tabla: 9-10pt

- **Pie de página:**
  - 8-9pt

## 5. Especificaciones Técnicas

### 5.1. Tamaño de Página
- A4 (210mm × 297mm)
- Márgenes: 20mm todos los lados

### 5.2. Biblioteca de Generación
- **Opción 1:** jsPDF + jsPDF-AutoTable (actual si existe)
- **Opción 2:** PDFMake (más flexible para layouts complejos)
- **Opción 3:** React-PDF (si se requiere preview en pantalla)

### 5.3. Estructura de Datos

```typescript
interface PrescriptionData {
  // Doctor info
  doctor: {
    name: string;
    specialty: string;
    license: string;
    address: string;
    phone: string;
    email?: string;
    logo?: string; // URL or base64
  };
  
  // Patient info
  patient: {
    fullName: string;
    age: number;
    dni: string;
    birthDate?: string;
  };
  
  // Prescription details
  prescription: {
    date: Date;
    prescriptionNumber?: string;
    medications: Array<{
      name: string;
      presentation: string;
      dose: string;
      frequency: string;
      duration?: string;
    }>;
    instructions?: string;
    diagnosis?: string;
  };
  
  // Template selection
  template: 'classic' | 'modern' | 'minimal';
}
```

## 6. Criterios de Aceptación

### Funcionales
- [ ] El PDF se genera con el nombre dinámico correcto
- [ ] Todos los datos del médico y paciente se muestran correctamente
- [ ] La tabla de medicamentos es legible y bien formateada
- [ ] El archivo se descarga automáticamente al generarse

### Estéticos
- [ ] El diseño es profesional y comparable a recetas reales
- [ ] La tipografía es legible en impresión
- [ ] Los colores son apropiados para uso médico
- [ ] El layout se adapta correctamente a diferentes cantidades de medicamentos

### Técnicos
- [ ] El PDF pesa menos de 500KB
- [ ] Se genera en menos de 2 segundos
- [ ] Funciona en Chrome, Firefox, Safari, Edge
- [ ] El PDF es imprimible sin pérdida de calidad

## 7. Casos de Prueba

### Manual
1. **Receta Simple:** 1-2 medicamentos
2. **Receta Compleja:** 5+ medicamentos con instrucciones largas
3. **Nombres Largos:** Paciente con nombre muy largo
4. **Sin Logo:** Médico sin logo configurado
5. **Plantillas:** Verificar las 3 plantillas se renderizan correctamente

### Automatizado
- Verificar que el nombre de archivo se genera correctamente
- Verificar que los metadatos del PDF son correctos
- Verificar que no hay errores de consola al generar

## 8. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| PDF muy pesado con logo | Medio | Comprimir imágenes, limitar tamaño de logo |
| Layout roto con muchos medicamentos | Alto | Implementar paginación automática |
| Caracteres especiales en nombres | Medio | Sanitizar strings antes de generar PDF |
| Incompatibilidad de fuentes | Bajo | Usar fuentes web-safe o embeber fuentes |

## 9. Próximos Pasos (Fase B)

1. Crear tests que verifiquen:
   - Generación de nombre de archivo
   - Estructura del PDF
   - Renderizado de plantillas

2. Estado esperado: **ROJO** (tests fallan porque la funcionalidad no existe)

## 10. Files-to-Touch (Fase C)

- `frontend/src/utils/pdfGenerator.ts` (o crear si no existe)
- `frontend/src/components/PrescriptionPreview.tsx` (opcional)
- `frontend/src/types/prescription.ts` (tipos TypeScript)
- `frontend/package.json` (si se añade nueva librería)

---

**Autor:** PBT-IA  
**Fecha:** 2026-01-04  
**Versión:** 1.0  
**Estado:** Pendiente de Aprobación
