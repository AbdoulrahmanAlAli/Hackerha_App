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
  JWT_REFRESH_SECRET: mustGet("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES_IN: (process.env.JWT_ACCESS_EXPIRES_IN ??
    "15m") as SignOptions["expiresIn"],
  JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN ??
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

  // firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID!,
  FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID!,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL!,
  FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID!,
  FIREBASE_CLIENT_CERT_URL: process.env.FIREBASE_CLIENT_CERT_URL!,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

  // bot_Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_PAYMENT_QR_PATH: process.env.TELEGRAM_PAYMENT_QR_PATH,
  BOT_ADMIN_ID: process.env.BOT_ADMIN_ID,
  
} as const;
