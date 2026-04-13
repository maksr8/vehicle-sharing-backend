import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export function validate<T>(
  schema: ZodType<T>,
  target: "body" | "params" | "query" = "body",
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsedData = schema.parse(req[target]);

      Object.defineProperty(req, target, {
        value: parsedData,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}
