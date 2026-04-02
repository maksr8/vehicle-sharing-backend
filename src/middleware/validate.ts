import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export function validate<T>(
  schema: ZodType<T>,
  target: "body" | "params" | "query" = "body",
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req[target] = schema.parse(req[target]);
    next();
  };
}
