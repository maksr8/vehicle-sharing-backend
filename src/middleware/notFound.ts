import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  const error = new AppError(404, "Not found");
  next(error);
}
