import { z } from "zod";

export const PacienteSchema = z.object({
    // Identificación
    nombre: z.string().min(2, "Mínimo 2 caracteres"),
    apellido_paterno: z.string().min(1, "Mínimo 1 caracter"),
    apellido_materno: z.string().optional(),
    dni: z.string().min(1, "DNI requerido"),
    fecha_nacimiento: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
        message: "Fecha de nacimiento inválida",
    }),
    sexo: z.string().default("M"), // Default to M or add selector

    // Contacto
    telefono: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    direccion: z.string().optional(),

    // Datos Sociales
    ocupacion: z.string().optional(),
    estado_civil: z.string().optional(),

    // Antropometría
    peso: z.number().default(0),
    talla: z.number().default(0),
    imc: z.number().default(0),

    // Extras
    grupo_sanguineo: z.string().optional(),
    alergias: z.string().optional(),
    observaciones: z.string().optional(),

    // Multitenancy
    ownerId: z.string(),
});

export type PacienteCreate = z.infer<typeof PacienteSchema>;
