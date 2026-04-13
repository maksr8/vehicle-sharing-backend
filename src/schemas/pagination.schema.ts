import * as z from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  maxPrice: z.coerce.number().int().min(0).max(10000).optional(),
  available: z
    .preprocess((value) => {
      if (typeof value === "string") {
        const normalized = value.toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
      }
      return value;
    }, z.boolean())
    .optional(),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;
