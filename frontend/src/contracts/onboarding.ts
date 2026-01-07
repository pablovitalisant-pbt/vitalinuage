
import { z } from "zod";
import { UserSchema } from "./user";

// No request body needed for completion signal
export const OnboardingCompleteRequestSchema = z.object({});

// Response satisfies UserSchema (is_onboarded: true)
export const OnboardingCompleteResponseSchema = UserSchema;
