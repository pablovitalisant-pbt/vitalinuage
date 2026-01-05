import { z } from "zod";

export const FieldConfigSchema = z.object({
    field_key: z.string(),
    x_mm: z.number(),
    y_mm: z.number(),
    font_size_pt: z.number().default(10),
    max_width_mm: z.number().optional()
});

export const PrescriptionMapSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Nombre requerido"),
    canvas_width_mm: z.number().positive(),
    canvas_height_mm: z.number().positive(),
    fields_config: z.array(FieldConfigSchema),
    is_active: z.boolean().default(true),
    background_image_url: z.string().optional()
});

export type PrescriptionMap = z.infer<typeof PrescriptionMapSchema>;
export type FieldConfig = z.infer<typeof FieldConfigSchema>;
