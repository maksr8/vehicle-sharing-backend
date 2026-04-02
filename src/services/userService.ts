import { AppError } from "../utils/AppError.js";
import { prisma } from "../db/prisma.js";
import type { SafeUser } from "../types/safeUser.js";

export async function getAllUsers(): Promise<SafeUser[]> {
  return await prisma.user.findMany({
    omit: {
      password: true,
    },
  });
}

export async function getUserById(id: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}
