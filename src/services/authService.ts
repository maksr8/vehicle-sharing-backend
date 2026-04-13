import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { LoginDto, RegisterDto } from "../schemas/auth.schema.js";
import type { StringValue } from "ms";
import type { SafeUser } from "../types/safeUser.js";
import type { JWTPayload } from "../types/jwtPayload.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN!;
const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS!);
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES_DAYS!,
);
const REGISTRATION_TOKEN_EXPIRES_IN =
  process.env.REGISTRATION_TOKEN_EXPIRES_IN!;

export async function register(dto: RegisterDto): Promise<{ message: string }> {
  const existingUser = await prisma.user.findUnique({
    where: { email: dto.email },
  });
  if (existingUser) {
    throw new AppError(409, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const registrationToken = jwt.sign(
    { email: dto.email, name: dto.name, password: hashedPassword },
    JWT_SECRET,
    { expiresIn: REGISTRATION_TOKEN_EXPIRES_IN as StringValue },
  );

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"Vehicle Share" <admin@vehicleshare.com>',
    to: dto.email,
    subject: "Verify your account",
    html: `<p>Click here to finish registration:</p> <a href="${process.env.FRONTEND_URL}/verify?token=${registrationToken}">Activate Account</a>`,
  });

  console.log("PREVIEW EMAIL URL: %s", nodemailer.getTestMessageUrl(info));

  return { message: "Verification email sent. Please check your terminal." };
}

export async function verifyRegistration(
  token: string,
): Promise<{ user: SafeUser }> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await prisma.user.create({
      data: {
        email: decoded.email,
        name: decoded.name,
        password: decoded.password, // This is already hashed
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "User already verified or exists");
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Access token is expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, "Access token is invalid");
    }
    throw new AppError(400, "Registration verification failed");
  }
}

export async function login(
  dto: LoginDto,
): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
  const user = await prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const { password: _, ...userWithoutPassword } = user;

  const tokens = await generateAuthSession(user.id, user.email, user.role);

  return {
    ...tokens,
    user: userWithoutPassword,
  };
}

export async function refresh(
  oldRefreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  if (!oldRefreshToken) {
    throw new AppError(401, "No refresh token provided");
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken: oldRefreshToken },
    include: { user: true },
  });

  if (!session) {
    throw new AppError(401, "Invalid refresh token");
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new AppError(401, "Refresh token expired. Please login again");
  }

  await prisma.session.delete({ where: { id: session.id } });

  const tokens = await generateAuthSession(
    session.user.id,
    session.user.email,
    session.user.role,
  );

  return tokens;
}

async function generateAuthSession(
  userId: string,
  email: string,
  role: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as StringValue,
  });

  const refreshToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.session.create({
    data: {
      refreshToken,
      userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}
