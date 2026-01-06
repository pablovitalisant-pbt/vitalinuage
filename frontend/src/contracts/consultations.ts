export interface ClinicalConsultation {
    id?: number;
    patient_id: number;
    motivo_consulta: string;
    examen_fisico?: string;
    diagnostico: string;
    plan_tratamiento: string;
    proxima_cita?: string;
    created_at?: string;
    updated_at?: string;
    email_sent_at?: string;
    whatsapp_sent_at?: string;
    patient?: {
        nombre: string;
        apellido_paterno: string;
        apellido_materno?: string;
        telefono?: string;
        email?: string;
    };
}

export interface ConsultationForm {
    motivo_consulta: string;
    examen_fisico?: string;
    diagnostico: string;
    plan_tratamiento: string;
    proxima_cita?: string;
}

