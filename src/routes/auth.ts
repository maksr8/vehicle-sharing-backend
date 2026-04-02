import express from "express";
import { jsonParser } from "../middleware/jsonParser.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import {
  login,
  register,
  refresh,
  verifyRegistration,
} from "../controllers/authController.js";
import cookieParser from "cookie-parser";

export const authRouter = express.Router();

authRouter.post("/register", jsonParser, validate(registerSchema), register);
authRouter.post("/login", jsonParser, validate(loginSchema), login);
authRouter.post("/refresh", cookieParser(), refresh);
authRouter.post("/verify-registration", jsonParser, verifyRegistration);
