import type { Request, Response } from "express";
import type {
  VehicleParamsDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from "../schemas/vehicle.schema.js";
import * as vehicleService from "../services/vehicleService.js";
import type { UserRole } from "../generated/prisma/enums.js";
import { emitFleetUpdate } from "../socket.js";
import type { PaginationQueryDto } from "../schemas/pagination.schema.js";

export async function getVehicles(req: Request, res: Response) {
  const query = req.query as PaginationQueryDto;
  const result = await vehicleService.getAllVehicles(
    req.user!.role as UserRole,
    query.page,
    query.limit,
  );

  res.json(result);
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
  emitFleetUpdate();
  res.status(201).json({ data: vehicle });
}

export async function updateVehicle(
  req: Request<VehicleParamsDto, unknown, UpdateVehicleDto>,
  res: Response,
) {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
  emitFleetUpdate();
  res.json({ data: vehicle });
}

export async function switchIsActive(
  req: Request<VehicleParamsDto>,
  res: Response,
) {
  const vehicle = await vehicleService.switchIsActive(req.params.id);
  emitFleetUpdate();
  res.json({ data: vehicle });
}

export async function deleteVehicle(
  req: Request<VehicleParamsDto>,
  res: Response,
) {
  await vehicleService.deleteVehicle(req.params.id);
  emitFleetUpdate();
  res.status(204).end();
}
