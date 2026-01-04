import { z } from "zod";

export const NotificationSchema = z.object({
    usuario_id: z.string().min(1),
    titulo: z.string().min(1),
    mensaje: z.string().min(1),
    tipo: z.enum(["CITA_NUEVA", "CITA_RECORDATORIO", "RECETA", "MARKETING"]),
    prioridad: z.enum(["ALTA", "NORMAL"]),
    data_payload: z.record(z.any()).optional(),
});

export type NotificationRequest = z.infer<typeof NotificationSchema>;
