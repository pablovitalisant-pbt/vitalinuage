import { z } from "zod";

export const MedicamentoSchema = z.object({
    nombre: z.string().min(2, "Nombre requerido"),
    dosis: z.string().min(1, "Dosis requerida"),
    frecuencia: z.string().min(1, "Frecuencia requerida"),
});

export const RecetaSchema = z.object({
    consulta_id: z.string().min(1),
    paciente_id: z.string().min(1),
    medicamentos: z.array(MedicamentoSchema).min(1, "Debe agregar al menos un medicamento"),
    instrucciones_adicionales: z.string().optional(),
    fecha_vencimiento: z.string().optional(), // String date (YYYY-MM-DD)
});

export type RecetaCreate = z.infer<typeof RecetaSchema>;
