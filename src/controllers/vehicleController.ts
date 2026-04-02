import type { Request, Response } from "express";
import type {
  VehicleParamsDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from "../schemas/vehicle.schema.js";
import * as vehicleService from "../services/vehicleService.js";
import type { UserRole } from "../generated/prisma/enums.js";

export async function getVehicles(req: Request, res: Response) {
  const vehicles = await vehicleService.getAllVehicles(
    req.user!.role as UserRole,
  );
  res.json({ data: vehicles });
}

export async function getVehicleById(
  req: Request<VehicleParamsDto>,
  res: Response,
) {
  const vehicle = await vehicleService.getVehicleById(req.params.id);
  res.json({ data: vehicle });
}

export async function createVehicle(
  req: Request<unknown, unknown, CreateVehicleDto>,
  res: Response,
) {
  const vehicle = await vehicleService.createVehicle(req.body);
  res.status(201).json({ data: vehicle });
}

export async function updateVehicle(
  req: Request<VehicleParamsDto, unknown, UpdateVehicleDto>,
  res: Response,
) {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
  res.json({ data: vehicle });
}

export async function switchIsActive(
  req: Request<VehicleParamsDto>,
  res: Response,
) {
  const vehicle = await vehicleService.switchIsActive(req.params.id);
  res.json({ data: vehicle });
}

export async function deleteVehicle(
  req: Request<VehicleParamsDto>,
  res: Response,
) {
  await vehicleService.deleteVehicle(req.params.id);
  res.status(204).end();
}
