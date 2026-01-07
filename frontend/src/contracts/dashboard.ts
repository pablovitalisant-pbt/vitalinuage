export interface DoctorProfile {
    professional_name: string;
    specialty: string;
    registration_number: string;
    is_onboarded: boolean;
}

export interface PatientSearchResult {
    id: number;
    nombre_completo: string;
    dni: string;
    imc: number;
}

export interface PatientSearchResponse {
    results: PatientSearchResult[];
}

import { z } from "zod";

export const ActivityItemSchema = z.object({
    patient_name: z.string(),
    action: z.string(),
    timestamp: z.string()
});

export const DashboardStatsSchema = z.object({
    total_patients: z.number(),
    appointments_today: z.number(),
    pending_tasks: z.number(),

    // Slice 20.0
    total_prescriptions: z.number().default(0),
    weekly_patient_flow: z.array(z.number()).default([]),
    efficiency_rate: z.number().default(0),

    recent_activity: z.array(ActivityItemSchema)
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
