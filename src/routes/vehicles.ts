import express, { type NextFunction } from "express";
import * as vehicleController from "../controllers/vehicleController.js";
import { jsonParser } from "../middleware/jsonParser.js";
import { validate } from "../middleware/validate.js";
import {
  VehicleParamsSchema,
  createVehicleSchema,
  updateVehicleSchema,
} from "../schemas/vehicle.schema.js";
import { requireRole } from "../middleware/role.js";
import { UserRole } from "../generated/prisma/enums.js";
import { requireAuth } from "../middleware/auth.js";

export const vehiclesRouter = express.Router();

vehiclesRouter.get("/", vehicleController.getVehicles);

vehiclesRouter.get(
  "/:id",
  validate(VehicleParamsSchema, "params"),
  vehicleController.getVehicleById,
);

vehiclesRouter.post(
  "/",
  requireAuth,
  requireRole([UserRole.ADMIN]),
  jsonParser,
  validate(createVehicleSchema),
  vehicleController.createVehicle,
);

vehiclesRouter.put(
  "/:id",
  requireAuth,
  requireRole([UserRole.ADMIN]),
  jsonParser,
  validate(VehicleParamsSchema, "params"),
  validate(updateVehicleSchema),
  vehicleController.updateVehicle,
);

vehiclesRouter.patch(
  "/:id/switch-isActive",
  requireAuth,
  requireRole([UserRole.ADMIN]),
  validate(VehicleParamsSchema, "params"),
  vehicleController.switchIsActive,
);

vehiclesRouter.delete(
  "/:id",
  requireAuth,
  requireRole([UserRole.ADMIN]),
  validate(VehicleParamsSchema, "params"),
  vehicleController.deleteVehicle,
);
