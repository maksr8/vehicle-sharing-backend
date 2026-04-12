import * as z from "zod";

export const createVehicleSchema = z.object({
  licensePlate: z.string().min(1, "LicensePlate is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number()
    .int()
    .min(1)
    .refine((y) => y <= new Date().getFullYear() + 1, {
      message: "Year must be at most next year",
    }),
  vin: z.string().min(1, "VIN is required"),
  pricePerMinuteCents: z
    .number()
    .int("Price must be an integer (cents)")
    .min(0, "Price cannot be negative")
    .max(10000, "Price exceeds maximum allowed limit ($100/min)"),
});

export const updateVehicleSchema = z.object({
  licensePlate: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z
    .number()
    .int()
    .min(1)
    .refine((y) => y <= new Date().getFullYear() + 1, {
      message: "Year must be at most next year",
    })
    .optional(),
  vin: z.string().min(1).optional(),
  pricePerMinuteCents: z
    .number()
    .int("Price must be an integer (cents)")
    .min(0, "Price cannot be negative")
    .max(10000, "Price exceeds maximum allowed limit ($100/min)")
    .optional(),
});

export const VehicleParamsSchema = z.object({
  id: z.uuid("Invalid ID format"),
});

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
export type VehicleParamsDto = z.infer<typeof VehicleParamsSchema>;
