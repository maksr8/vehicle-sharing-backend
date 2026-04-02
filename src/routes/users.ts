import express, { type NextFunction } from "express";
import * as userController from "../controllers/userController.js";
import { validate } from "../middleware/validate.js";
import { UserParamsSchema } from "../schemas/user.schema.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { UserRole } from "../generated/prisma/enums.js";

export const usersRouter = express.Router();

usersRouter.get(
  "/",
  requireAuth,
  requireRole([UserRole.ADMIN]),
  userController.getUsers,
);

usersRouter.get("/me", requireAuth, userController.getCurrentUser);

usersRouter.get(
  "/:id",
  requireAuth,
  requireRole([UserRole.ADMIN]),
  validate(UserParamsSchema, "params"),
  userController.getUserById,
);
