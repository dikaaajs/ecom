import { z } from "zod";
export const emailInput = z.object({ email: z.email().max(200) }).strict();
export const tokenInput = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const resetInput = tokenInput.extend({ password: z.string().min(12).max(128) });
