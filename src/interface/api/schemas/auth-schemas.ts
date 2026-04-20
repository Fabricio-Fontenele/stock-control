import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const authTokenSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["admin", "employee"])
  })
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthTokenResponse = z.infer<typeof authTokenSchema>;
