import { prisma } from "../db/prisma.js";
import {
  Prisma,
  RideStatus,
  UserRole,
  type Vehicle,
} from "../generated/prisma/client.js";
import type {
  CreateVehicleDto,
  UpdateVehicleDto,
} from "../schemas/vehicle.schema.js";
import type { PaginatedResult } from "../types/pagination.js";
import { AppError } from "../utils/AppError.js";

type VehicleListFilters = {
  search?: string;
  maxPrice?: number;
  available?: boolean;
};

export async function getAllVehicles(
  role: UserRole,
  page?: number,
  limit?: number,
  filters: VehicleListFilters = {},
): Promise<PaginatedResult<Vehicle>> {
  const whereClause: Prisma.VehicleWhereInput = {};

  if (role === UserRole.ADMIN) {
    if (filters.available !== undefined) {
      whereClause.available = filters.available;
    }
  } else {
    whereClause.isActive = true;
    whereClause.available = true;
    if (filters.maxPrice !== undefined) {
      whereClause.pricePerMinuteCents = { lte: filters.maxPrice };
    }
  }

  const normalizedSearch = filters.search?.trim();
  if (normalizedSearch) {
    const searchConditions: Prisma.VehicleWhereInput[] = [
      { licensePlate: { contains: normalizedSearch, mode: "insensitive" } },
      { model: { contains: normalizedSearch, mode: "insensitive" } },
      { vin: { contains: normalizedSearch, mode: "insensitive" } },
    ];

    const numericYear = Number.parseInt(normalizedSearch, 10);
    if (!Number.isNaN(numericYear)) {
      searchConditions.push({ year: numericYear });
    }

    whereClause.OR = searchConditions;
  }

  if (!page || !limit) {
    const data = await prisma.vehicle.findMany({
      where: whereClause,
      orderBy: { model: "asc" },
    });
    return {
      data,
      meta: { total: data.length, page: 1, limit: data.length, totalPages: 1 },
    };
  }

  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { model: "asc" },
    }),
    prisma.vehicle.count({ where: whereClause }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
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
        throw new AppError(
          409,
          "Vehicle with this VIN or license plate already exists",
        );
      }
    }
    throw error;
  }
}

export async function updateVehicle(
  id: string,
  dto: UpdateVehicleDto,
): Promise<Vehicle> {
  const activeRide = await prisma.ride.findFirst({
    where: {
      vehicleId: id,
      status: RideStatus.ACTIVE,
    },
    select: { id: true },
  });

  if (activeRide) {
    throw new AppError(
      409,
      "Cannot update vehicle while it has an active ride",
    );
  }

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
        throw new AppError(
          409,
          "Another vehicle with this VIN or license plate already exists",
        );
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
