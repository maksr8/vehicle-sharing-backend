import type { Request, Response } from "express";
import type { LoginDto, RegisterDto } from "../schemas/auth.schema.js";
import * as authService from "../services/authService.js";

const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS!);
const COOKIE_MAX_AGE = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: COOKIE_MAX_AGE,
  sameSite: "strict" as const,
};

export async function register(
  req: Request<unknown, unknown, RegisterDto>,
  res: Response,
) {
  const message = await authService.register(req.body);

  res.status(200).json({ data: { message } }); // not 201
}

export async function verifyRegistration(req: Request, res: Response) {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const user = await authService.verifyRegistration(token);

  res.status(201).json({ data: { user } });
}

export async function login(
  req: Request<unknown, unknown, LoginDto>,
  res: Response,
) {
  const { accessToken, refreshToken, user } = await authService.login(req.body);

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.json({ data: { accessToken, user } });
}

export async function refresh(req: Request, res: Response) {
  const oldRefreshToken = req.cookies.refreshToken;

  const { accessToken, refreshToken } =
    await authService.refresh(oldRefreshToken);

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.json({ data: { accessToken } });
}
