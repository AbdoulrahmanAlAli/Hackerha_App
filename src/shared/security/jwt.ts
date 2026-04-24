import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { env } from "../../bootstrap/env";

export type JwtPayload = { 
  id: string; 
  role?: string; 
  university: "دمشق" | "حلب" | "الكل";
  iat?: number;  
  exp?: number; 
};

const accessSecret: Secret = env.JWT_ACCESS_SECRET;

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, accessSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, accessSecret) as JwtPayload;
}