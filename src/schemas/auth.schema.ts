import * as z from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password cannot exceed 64 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
