import { z } from "zod";

export const PatientSearchSchema = z.object({
    query: z.string().min(1, "Escriba al menos 1 caracter"),
});

export type PatientSearchQuery = z.infer<typeof PatientSearchSchema>;

export const PatientSummarySchema = z.object({
    id: z.string(),
    nombre_completo: z.string(),
    dni: z.string(),
    imc: z.number(),
});

export const PatientSearchResponseSchema = z.object({
    results: z.array(PatientSummarySchema)
});
