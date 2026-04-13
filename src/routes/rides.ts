import express from "express";
import * as rideController from "../controllers/rideController.js";
import { jsonParser } from "../middleware/jsonParser.js";
import { validate } from "../middleware/validate.js";
import { createRideSchema, RideParamsSchema } from "../schemas/ride.schema.js";
import { requireAuth } from "../middleware/auth.js";
import { paginationQuerySchema } from "../schemas/pagination.schema.js";

export const ridesRouter = express.Router();

ridesRouter.get(
  "/",
  requireAuth,
  validate(paginationQuerySchema, "query"),
  rideController.getRides,
);

ridesRouter.post(
  "/",
  requireAuth,
  jsonParser,
  validate(createRideSchema),
  rideController.createRide,
);

ridesRouter.post(
  "/:id/finish",
  requireAuth,
  validate(RideParamsSchema, "params"),
  rideController.finishRide,
);
