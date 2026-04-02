import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import type { JWTPayload } from "../types/jwtPayload.js";

const JWT_SECRET = process.env.JWT_SECRET!;

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Please provide a valid Bearer token");
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Access token is expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, "Access token is invalid");
    }

    throw new AppError(401, "Authorization failed");
  }
}
