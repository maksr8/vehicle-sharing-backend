import {
  RideStatus,
  Prisma,
  UserRole,
  type Ride,
} from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { PaginatedResult } from "../types/pagination.js";

export async function getAllRides(
  userId: string,
  role: UserRole,
  page?: number,
  limit?: number,
): Promise<PaginatedResult<Ride>> {
  const whereClause = role === UserRole.ADMIN ? {} : { userId };

  if (!page || !limit) {
    const data = await prisma.ride.findMany({
      where: whereClause,
      include: { vehicle: true },
      orderBy: { rideDate: "desc" },
    });
    return {
      data,
      meta: { total: data.length, page: 1, limit: data.length, totalPages: 1 },
    };
  }

  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.ride.findMany({
      where: whereClause,
      include: { vehicle: true },
      skip,
      take: limit,
      orderBy: { rideDate: "desc" },
    }),
    prisma.ride.count({ where: whereClause }),
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

export async function createRide(
  vehicleId: string,
  userId: string,
): Promise<Ride> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { available: true, isActive: true },
  });

  if (!vehicle) throw new AppError(404, "Vehicle not found");
  if (!vehicle.available) throw new AppError(409, "Vehicle is not available");
  if (!vehicle.isActive) throw new AppError(409, "Vehicle is out of service");

  const activeRide = await prisma.ride.findFirst({
    where: {
      vehicleId: vehicleId,
      status: RideStatus.ACTIVE,
    },
    select: { id: true },
  });

  if (activeRide) {
    throw new AppError(409, "Vehicle is already on ride");
  }

  try {
    const [ride] = await prisma.$transaction([
      prisma.ride.create({
        data: {
          userId: userId,
          vehicleId: vehicleId,
        },
        include: { vehicle: true },
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { available: false },
      }),
    ]);

    return ride;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new AppError(404, "User or Vehicle not found");
      }
    }
    throw error;
  }
}

export async function finishRide(
  rideId: string,
  userId: string,
  role: UserRole,
): Promise<Ride> {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { vehicle: { select: { pricePerMinuteCents: true } } },
  });

  if (!ride) throw new AppError(404, "Ride not found");

  if (role !== UserRole.ADMIN && ride.userId !== userId) {
    throw new AppError(403, "You can only finish your own rides");
  }

  if (ride.status === RideStatus.FINISHED) {
    throw new AppError(409, "Ride is already finished");
  }

  const finishDate = new Date();
  const durationMs = finishDate.getTime() - ride.rideDate.getTime();

  const durationMinutes = Math.max(1, Math.ceil(durationMs / (1000 * 60)));

  const calculatedCostCents =
    durationMinutes * ride.vehicle.pricePerMinuteCents;

  const [updatedRide] = await prisma.$transaction([
    prisma.ride.update({
      where: { id: rideId },
      data: {
        status: RideStatus.FINISHED,
        finishDate: finishDate,
        totalCostCents: calculatedCostCents,
      },
      include: { vehicle: true },
    }),
    prisma.vehicle.update({
      where: { id: ride.vehicleId },
      data: { available: true },
    }),
  ]);

  return updatedRide;
}
