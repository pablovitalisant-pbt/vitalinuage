import { z } from "zod";

export const LoginRequestSchema = z.object({
    email: z.string().email("Debe ser un correo válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const UserProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: z.string().default("doctor"),
});

export const LoginResponseSchema = z.object({
    token: z.string(),
    user: UserProfileSchema,
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
