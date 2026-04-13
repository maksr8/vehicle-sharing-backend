import type { Request, Response } from "express";
import type { CreateRideDto, RideParamsDto } from "../schemas/ride.schema.js";
import * as rideService from "../services/rideService.js";
import type { UserRole } from "../generated/prisma/enums.js";
import { emitFleetUpdate } from "../socket.js";
import type { PaginationQueryDto } from "../schemas/pagination.schema.js";

export async function getRides(req: Request, res: Response) {
  const { userId, role } = req.user!;
  const query = req.query as PaginationQueryDto;

  const result = await rideService.getAllRides(
    userId,
    role as UserRole,
    query.page,
    query.limit,
  );

  res.json(result);
}

export async function createRide(
  req: Request<unknown, unknown, CreateRideDto>,
  res: Response,
) {
  const currentUserId = req.user!.userId;
  const { vehicleId } = req.body;

  const ride = await rideService.createRide(vehicleId, currentUserId);
  emitFleetUpdate();
  res.status(201).json({ data: ride });
}

export async function finishRide(req: Request<RideParamsDto>, res: Response) {
  const { userId, role } = req.user!;
  const rideId = req.params.id;

  const ride = await rideService.finishRide(rideId, userId, role as UserRole);
  emitFleetUpdate();
  res.json({ data: ride });
}
