import { z } from "zod";

export const ConsultaSchema = z.object({
    paciente_id: z.string().min(1, "Debe seleccionar un paciente"),
    diagnostico: z.string().min(3, "El diagnóstico es obligatorio"),
    examenes_solicitados: z.string().optional(),
    tratamiento: z.string().min(3, "El tratamiento es obligatorio"),
    observaciones_privadas: z.string().optional(),
});

export type ConsultaCreate = z.infer<typeof ConsultaSchema>;
