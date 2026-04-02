import * as z from "zod";

export const createRideSchema = z.object({
  vehicleId: z.string().min(1, "vehicleId is required"),
});

export const RideParamsSchema = z.object({
  id: z.uuid("Invalid ID format"),
});

export type CreateRideDto = z.infer<typeof createRideSchema>;
export type RideParamsDto = z.infer<typeof RideParamsSchema>;
