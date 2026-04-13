import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import {
  UserRole,
  type Ride,
  type Vehicle,
} from "../generated/prisma/client.js";
import * as vehicleService from "../services/vehicleService.js";
import * as rideService from "../services/rideService.js";
import * as userService from "../services/userService.js";
import * as authService from "../services/authService.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../schemas/vehicle.schema.js";
import { createRideSchema, RideParamsSchema } from "../schemas/ride.schema.js";
import { UserParamsSchema } from "../schemas/user.schema.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { paginationQuerySchema } from "../schemas/pagination.schema.js";
import { emitFleetUpdate } from "../socket.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS!);
const COOKIE_MAX_AGE = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: COOKIE_MAX_AGE,
  sameSite: "strict" as const,
};

type GraphQLContext = {
  req: Request;
  res: Response;
  user: { userId: string; email: string; role: UserRole } | null;
};

function parseCookieValue(
  cookieHeader: string | undefined,
  key: string,
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${key}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(key.length + 1));
}

function extractAuthUser(req: Request): GraphQLContext["user"] {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET) as GraphQLContext["user"];
  } catch {
    return null;
  }
}

function requireUser(context: GraphQLContext) {
  if (!context.user) {
    throw new AppError(401, "Please provide a valid Bearer token");
  }
  return context.user;
}

function requireAdmin(context: GraphQLContext) {
  const user = requireUser(context);
  if (user.role !== UserRole.ADMIN) {
    throw new AppError(403, "Forbidden");
  }
  return user;
}

function serializeRide(ride: Ride & { vehicle?: Vehicle | null }) {
  return {
    ...ride,
    rideDate: ride.rideDate.toISOString(),
    finishDate: ride.finishDate ? ride.finishDate.toISOString() : null,
  };
}

export const typeDefs = `#graphql
  enum UserRole {
    USER
    ADMIN
  }

  enum RideStatus {
    ACTIVE
    FINISHED
  }

  type PaginationMeta {
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type Vehicle {
    id: ID!
    licensePlate: String!
    model: String!
    year: Int!
    vin: String!
    available: Boolean!
    isActive: Boolean!
    pricePerMinuteCents: Int!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
  }

  type Ride {
    id: ID!
    userId: ID!
    vehicleId: ID!
    rideDate: String!
    finishDate: String
    status: RideStatus!
    totalCostCents: Int
    vehicle: Vehicle
  }

  type PaginatedVehicles {
    data: [Vehicle!]!
    meta: PaginationMeta!
  }

  type PaginatedRides {
    data: [Ride!]!
    meta: PaginationMeta!
  }

  type RegisterResult {
    message: String!
  }

  type AuthPayload {
    accessToken: String!
    user: User
  }

  type VerifyRegistrationResult {
    user: User!
  }

  input CreateVehicleInput {
    licensePlate: String!
    model: String!
    year: Int!
    vin: String!
    pricePerMinuteCents: Int!
  }

  input UpdateVehicleInput {
    licensePlate: String
    model: String
    year: Int
    vin: String
    pricePerMinuteCents: Int
  }

  type Query {
    vehicles(
      page: Int
      limit: Int
      search: String
      maxPrice: Int
      available: Boolean
    ): PaginatedVehicles!
    vehicle(id: ID!): Vehicle!
    rides(page: Int, limit: Int): PaginatedRides!
    users: [User!]!
    user(id: ID!): User!
    me: User!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): RegisterResult!
    verifyRegistration(token: String!): VerifyRegistrationResult!
    login(email: String!, password: String!): AuthPayload!
    refreshAuth: AuthPayload!

    createRide(vehicleId: ID!): Ride!
    finishRide(id: ID!): Ride!

    createVehicle(input: CreateVehicleInput!): Vehicle!
    updateVehicle(id: ID!, input: UpdateVehicleInput!): Vehicle!
    switchVehicleIsActive(id: ID!): Vehicle!
    deleteVehicle(id: ID!): Boolean!
  }
`;

export const resolvers = {
  Query: {
    vehicles: async (
      _parent: unknown,
      args: {
        page?: number;
        limit?: number;
        search?: string;
        maxPrice?: number;
        available?: boolean;
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);
      const query = paginationQuerySchema.parse(args);
      const filters: Record<string, unknown> = {};
      if (query.search !== undefined) filters.search = query.search;
      if (query.maxPrice !== undefined) filters.maxPrice = query.maxPrice;
      if (query.available !== undefined) filters.available = query.available;
      return vehicleService.getAllVehicles(
        user.role,
        query.page,
        query.limit,
        filters,
      );
    },
    vehicle: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      requireUser(context);
      return vehicleService.getVehicleById(args.id);
    },
    rides: async (
      _parent: unknown,
      args: { page?: number; limit?: number },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);
      const query = paginationQuerySchema.parse(args);
      const result = await rideService.getAllRides(
        user.userId,
        user.role,
        query.page,
        query.limit,
      );
      return {
        ...result,
        data: result.data.map((ride) => serializeRide(ride)),
      };
    },
    users: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireAdmin(context);
      return userService.getAllUsers();
    },
    user: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      requireAdmin(context);
      const parsed = UserParamsSchema.parse(args);
      return userService.getUserById(parsed.id);
    },
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context);
      return userService.getUserById(user.userId);
    },
  },
  Mutation: {
    register: async (
      _parent: unknown,
      args: { name: string; email: string; password: string },
    ) => {
      const parsed = registerSchema.parse(args);
      const result = await authService.register(parsed);
      return { message: result.message };
    },
    verifyRegistration: async (_parent: unknown, args: { token: string }) => {
      const result = await authService.verifyRegistration(args.token);
      return result;
    },
    login: async (
      _parent: unknown,
      args: { email: string; password: string },
      context: GraphQLContext,
    ) => {
      const parsed = loginSchema.parse(args);
      const { accessToken, refreshToken, user } =
        await authService.login(parsed);
      context.res.cookie("refreshToken", refreshToken, cookieOptions);
      return { accessToken, user };
    },
    refreshAuth: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const oldRefreshToken = parseCookieValue(
        context.req.headers.cookie,
        "refreshToken",
      );
      const { accessToken, refreshToken } = await authService.refresh(
        oldRefreshToken as string,
      );
      context.res.cookie("refreshToken", refreshToken, cookieOptions);
      return { accessToken, user: null };
    },
    createRide: async (
      _parent: unknown,
      args: { vehicleId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);
      const parsed = createRideSchema.parse(args);
      const ride = await rideService.createRide(parsed.vehicleId, user.userId);
      emitFleetUpdate();
      return serializeRide(ride);
    },
    finishRide: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);
      const parsed = RideParamsSchema.parse(args);
      const ride = await rideService.finishRide(
        parsed.id,
        user.userId,
        user.role,
      );
      emitFleetUpdate();
      return serializeRide(ride);
    },
    createVehicle: async (
      _parent: unknown,
      args: { input: unknown },
      context: GraphQLContext,
    ) => {
      requireAdmin(context);
      const parsed = createVehicleSchema.parse(args.input);
      const vehicle = await vehicleService.createVehicle(parsed);
      emitFleetUpdate();
      return vehicle;
    },
    updateVehicle: async (
      _parent: unknown,
      args: { id: string; input: unknown },
      context: GraphQLContext,
    ) => {
      requireAdmin(context);
      const parsed = updateVehicleSchema.parse(args.input);
      const vehicle = await vehicleService.updateVehicle(args.id, parsed);
      emitFleetUpdate();
      return vehicle;
    },
    switchVehicleIsActive: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      requireAdmin(context);
      const vehicle = await vehicleService.switchIsActive(args.id);
      emitFleetUpdate();
      return vehicle;
    },
    deleteVehicle: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      requireAdmin(context);
      await vehicleService.deleteVehicle(args.id);
      emitFleetUpdate();
      return true;
    },
  },
};

export function buildGraphQLContext(
  req: Request,
  res: Response,
): GraphQLContext {
  return {
    req,
    res,
    user: extractAuthUser(req),
  };
}
