import * as z from "zod";

export const UserParamsSchema = z.object({
  id: z.uuid("Invalid ID format"),
});

export type UserParamsDto = z.infer<typeof UserParamsSchema>;
