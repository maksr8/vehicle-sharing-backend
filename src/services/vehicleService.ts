import { prisma } from "../db/prisma.js";
import { Prisma, UserRole, type Vehicle } from "../generated/prisma/client.js";
import type {
  CreateVehicleDto,
  UpdateVehicleDto,
} from "../schemas/vehicle.schema.js";
import { AppError } from "../utils/AppError.js";

export async function getAllVehicles(role: UserRole): Promise<Vehicle[]> {
  const whereClause = role === UserRole.ADMIN ? {} : { isActive: true };

  return await prisma.vehicle.findMany({
    where: whereClause,
  });
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) throw new AppError(404, "Vehicle not found");

  return vehicle;
}

export async function createVehicle(dto: CreateVehicleDto): Promise<Vehicle> {
  try {
    return await prisma.vehicle.create({
      data: {
        ...dto,
        available: true,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError(409, "Vehicle with this VIN already exists");
      }
    }
    throw error;
  }
}

export async function updateVehicle(
  id: string,
  dto: UpdateVehicleDto,
): Promise<Vehicle> {
  const updateData: Prisma.VehicleUpdateInput = {};
  if (dto.licensePlate !== undefined)
    updateData.licensePlate = dto.licensePlate;
  if (dto.model !== undefined) updateData.model = dto.model;
  if (dto.year !== undefined) updateData.year = dto.year;
  if (dto.vin !== undefined) updateData.vin = dto.vin;
  if (dto.pricePerMinuteCents !== undefined)
    updateData.pricePerMinuteCents = dto.pricePerMinuteCents;

  try {
    return await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new AppError(404, "Vehicle not found");
      }
      if (error.code === "P2002") {
        throw new AppError(409, "Another vehicle with this VIN already exists");
      }
    }
    throw error;
  }
}

export async function switchIsActive(id: string): Promise<Vehicle> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new AppError(404, "Vehicle not found");

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: { isActive: !vehicle.isActive },
  });

  return updatedVehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const hasRide = await prisma.ride.findFirst({
    where: { vehicleId: id },
    select: { id: true },
  });

  if (hasRide) {
    throw new AppError(409, "Cannot delete a vehicle that has a ride history");
  }

  try {
    await prisma.vehicle.delete({
      where: { id },
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new AppError(404, "Vehicle not found");
      }
    }
    throw error;
  }
}
