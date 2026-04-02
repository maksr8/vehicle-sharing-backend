import type { JwtPayload } from "jsonwebtoken";

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}
