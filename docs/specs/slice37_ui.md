# Spec: Slice 37.1 - Portability UI

## 1. UI Components

### Data Management Card
A card component styled like the rest of the app (white bg, shadow-sm, rounded-xl).

#### Header
Title: "Gestión de Datos y Portabilidad"
Description: "Descarga una copia completa de tus registros médicos o restaura desde un respaldo anterior."

#### Action Grid (2 Columns)

**Left: Export (Egress)**
- Icon: `Download` (Lucide React)
- Title: "Exportar Información"
- Text: "Descarga un archivo ZIP con todos tus pacientes y consultas en formato CSV compatible con Excel."
- Button: [Descargar Copia de Seguridad] (Primary Blue)

**Right: Import (Ingress)**
- Icon: `Upload` (Lucide React)
- Title: "Restaurar Respaldo"
- Text: "Sube un archivo ZIP generado previamente por Vitalinuage para restaurar tu historial."
- Button: [Subir Archivo] (Secondary White/Border)

## 2. Interaction Flows

### Export Flow
1. User clicks "Descargar".
2. Button changes to Spinner "Generando...".
3. Backend returns file.
4. Browser downloads `vitalinuage_backup_DATE.zip`.
5. Button returns to normal.

### Import Flow
1. User clicks "Subir".
2. HTML File Input (`.zip`) opens.
3. User selects file.
4. Modal "Procesando importación..." appears (Blocking).
5. Success/Error Modal displays results:
    - "Importación Completada"
    - "Pacientes Nuevos: X"
    - "Consultas: Y"
    - "Errores: Z"

## 3. Data Types (Frontend)
```typescript
interface ImportStats {
    patients_processed: number;
    patients_inserted: number;
    consultations_inserted: number;
    errors: string[];
}
```
