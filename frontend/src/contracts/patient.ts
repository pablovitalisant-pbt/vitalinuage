
import { z } from "zod";

export const PatientStatus = z.enum(["Activo", "En Seguimiento", "Inactivo"]);

export const PatientItemSchema = z.object({
    id: z.number(),
    full_name: z.string(),
    id_number: z.string(),
    last_consultation: z.string().nullable().optional(), // ISO String
    status: z.string() // Or PatientStatus if strict
});

export const PatientListResponseSchema = z.object({
    data: z.array(PatientItemSchema),
    total: z.number(),
    page: z.number(),
    size: z.number()
});

export type PatientListResponse = z.infer<typeof PatientListResponseSchema>;

export type PatientItem = z.infer<typeof PatientItemSchema>;

export const ClinicalRecordSchema = z.object({
    blood_type: z.string().nullable().optional().transform(v => v?.trim()),
    allergies: z.array(z.string().transform(v => v.trim())),
    chronic_conditions: z.array(z.string().transform(v => v.trim())),
    family_history: z.string().nullable().optional().transform(v => v?.trim()),
    current_medications: z.array(z.string().transform(v => v.trim()))
});


export type ClinicalRecord = z.infer<typeof ClinicalRecordSchema>;

export const ConsultationSchema = z.object({
    reason: z.string().min(1, "El motivo es requerido").transform(v => v.trim()),
    diagnosis: z.string().nullable().optional().transform(v => v?.trim()),
    treatment: z.string().nullable().optional().transform(v => v?.trim()),
    notes: z.string().nullable().optional().transform(v => v?.trim())
});

export type ConsultationCreate = z.infer<typeof ConsultationSchema>;

export const ConsultationItemSchema = ConsultationSchema.extend({
    id: z.number(),
    date: z.string(), // ISO
    created_at: z.string(),
    prescription_id: z.number().nullable().optional(), // Slice 18.1
});

export type ConsultationItem = z.infer<typeof ConsultationItemSchema>;

// Prescription Schemas (Slice 18.0)
export const MedicationItemSchema = z.object({
    name: z.string().min(1, "Nombre del medicamento requerido").transform(v => v.trim()),
    dosage: z.string().min(1, "Dosis requerida").transform(v => v.trim()),
    frequency: z.string().min(1, "Frecuencia requerida").transform(v => v.trim()),
    duration: z.string().min(1, "Duración requerida").transform(v => v.trim()),
    notes: z.string().nullable().optional().transform(v => v?.trim()),
});

export const PrescriptionCreateSchema = z.object({
    consultation_id: z.number(),
    medications: z.array(MedicationItemSchema).min(1, "Debe incluir al menos un medicamento"),
});

export const PrescriptionResponseSchema = z.object({
    id: z.number(),
    date: z.string().or(z.date()),
    doctor_name: z.string(),
    patient_name: z.string(),
    medications: z.array(MedicationItemSchema),
});

export type MedicationItem = z.infer<typeof MedicationItemSchema>;
export type PrescriptionCreate = z.infer<typeof PrescriptionCreateSchema>;
export type PrescriptionResponse = z.infer<typeof PrescriptionResponseSchema>;
