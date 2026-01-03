import "dotenv/config";
import { SignOptions } from "jsonwebtoken";

function mustGet(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  MONGO_URI: mustGet("MONGO_URI"),

  // security
  OTP_PEPPER: process.env.OTP_PEPPER ?? "4x!F8s#2$kL9qP1v*W5zY7mDc6RnG3j",
  NODE_ENV: process.env.NODE_ENV ?? "Development",
  JWT_ACCESS_SECRET: mustGet("JWT_ACCESS_SECRET"),
  JWT_ACCESS_EXPIRES_IN: (process.env.JWT_ACCESS_EXPIRES_IN ??
    "15m") as SignOptions["expiresIn"],

  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),

  // email
  EMAIL_USER: process.env.EMAIL_USER ?? "",
  EMAIL_PASS: process.env.EMAIL_PASS ?? "",
  SMTP_HOST: process.env.SMTP_HOST ?? "smtp.hostinger.com",
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,

  // cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
} as const;
