# Plan de Consolidación - Slice 27: Fichas Duplicadas

## 1. Auditoría de Duplicados

### Rutas Identificadas (App.tsx)
- **/patients/:id**
  - **Componente:** `PatientDetailPage` (Definido internamente en `App.tsx`)
  - **Características:** Diseño de "Fichas/Cards" (Grupo Sanguíneo, Alergias, etc.), Edición Inline, Hook `useClinicalRecord`.
  - **Estado:** "La Bonita" (Visualmente rica), Conectada al Backend (`/api/patients/:id/clinical-record`).

- **/patient/:id**
  - **Componente:** `PatientProfile` (`src/pages/PatientProfile.tsx`)
  - **Características:** Cabecera con datos demográficos, Pestañas (Consultas, Antecedentes), `ConsultationModal` (Estabilizado).
  - **Estado:** "La Oficial" (Lógica de negocio robusta), Conectada al Backend. Usa `MedicalBackgroundManager` (diseño simple de textareas).

### Conflicto
Existen dos visiones de la misma entidad "Paciente".
- `PatientDetailPage` tiene la mejor UI para datos clínicos (Cards).
- `PatientProfile` tiene la mejor arquitectura y lógica de edición para perfil y consultas.

## 2. Plan de Fusión (Estrategia)

**Objetivo:** Mover las "Cards" de `App.tsx` dentro de `PatientProfile.tsx`.

**Pasos Propuestos:**
1.  **Extracción de Lógica:**
    - Mover el hook `useClinicalRecord` (actualmente en `App.tsx`) a un archivo dedicado `src/hooks/useClinicalRecord.ts`.
2.  **Componentización UI:**
    - Extraer el JSX de las Cards (líneas ~693-828 de `App.tsx`) a un nuevo componente `src/components/ClinicalSummaryCards.tsx`.
    - Este componente debe aceptar `isEditing` y el objeto `record` como props, o manejar su propia lógica de edición encapsulada.
3.  **Integración en PatientProfile:**
    - Reemplazar el contenido de la pestaña "Antecedentes" (o agregar una nueva sección principal) en `PatientProfile.tsx` con `<ClinicalSummaryCards />`.
    - Esto reemplazará o complementará a `MedicalBackgroundManager`. *Nota: MedicalBackgroundManager usa un endpoint diferente. Se deberá decidir si migrar los datos o actualizar el endpoint.*
4.  **Limpieza:**
    - Eliminar `PatientDetailPage` de `App.tsx`.
    - Redirigir `/patients/:id` a `/patient/:id`.

## 3. Fragmento de Código (Diseño "Fichas")

Este es el código que se extraerá y migrará:

```tsx
// Dependencias visuales: Droplet, AlertCircle, Activity, Pill de 'lucide-react'

// Layout de Grid 2x2 para las Fichas
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    {/* Grupo Sanguíneo */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center mb-4">
            <div className="p-2 bg-red-100 rounded-lg text-red-600 mr-3">
                <Droplet size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Grupo Sanguíneo</h3>
        </div>
        {isEditing ? (
            <select
                className="w-full mt-auto block pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                value={formData.blood_type || ""}
                onChange={e => setFormData({ ...formData, blood_type: e.target.value || null })}
            >
                <option value="">Seleccionar...</option>
                {/* Opciones... */}
            </select>
        ) : (
            <div className="text-3xl font-bold text-slate-800 mt-auto">
                {record.blood_type || <span className="text-slate-400 text-lg font-normal">No registrado</span>}
            </div>
        )}
    </div>

    {/* Alergias */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center mb-4">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 mr-3">
                <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Alergias</h3>
        </div>
        {/* Renderizado Condicional Lista/Textarea */}
    </div>

    {/* Condiciones Crónicas */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3">
                <Activity size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Condiciones Crónicas</h3>
        </div>
        {/* Renderizado Condicional Lista/Textarea */}
    </div>

    {/* Medicación Actual */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 mr-3">
                <Pill size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Medicación Actual</h3>
        </div>
        {/* Renderizado Condicional Lista/Textarea */}
    </div>
</div>
```
