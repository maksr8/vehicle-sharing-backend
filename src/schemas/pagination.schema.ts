import * as z from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;
