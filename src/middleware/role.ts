import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import type { UserRole } from "../generated/prisma/enums.js";

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError(403, "Not authorized for this action");
    }

    next();
  };
}
