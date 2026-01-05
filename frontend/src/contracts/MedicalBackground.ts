export interface MedicalBackground {
    id?: number;
    patient_id: number;
    patologicos?: string;
    no_patologicos?: string;
    heredofamiliares?: string;
    quirurgicos?: string;
    alergias?: string;
    medicamentos_actuales?: string;
    updated_at?: string;
}
