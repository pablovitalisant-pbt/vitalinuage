import { z } from "zod";

export const OnboardingSchema = z.object({
    professional_name: z.string().min(1, "El nombre profesional es requerido"),
    specialty: z.string().min(1, "La especialidad es requerida"),
    medical_license: z.string().min(1, "La matrícula es requerida"),
    onboarding_completed: z.literal(true)
});

export type OnboardingData = z.infer<typeof OnboardingSchema>;
