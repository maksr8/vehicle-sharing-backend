import express from "express";
import { vehiclesRouter } from "./vehicles.js";
import { usersRouter } from "./users.js";
import { ridesRouter } from "./rides.js";
import { authRouter } from "./auth.js";

export const routes = express.Router();

routes.use("/vehicles", vehiclesRouter);
routes.use("/users", usersRouter);
routes.use("/rides", ridesRouter);
routes.use("/auth", authRouter);
