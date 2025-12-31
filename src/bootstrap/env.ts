import "dotenv/config";
import { SignOptions } from "jsonwebtoken";

function mustGet(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  MONGO_URI: mustGet("MONGO_URI"),

  JWT_ACCESS_SECRET: mustGet("JWT_ACCESS_SECRET"),
  JWT_ACCESS_EXPIRES_IN: (process.env.JWT_ACCESS_EXPIRES_IN ??
    "15m") as SignOptions["expiresIn"],

  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
} as const;
