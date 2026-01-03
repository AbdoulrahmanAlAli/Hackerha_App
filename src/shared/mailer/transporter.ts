import nodemailer from "nodemailer";
import { env } from "../../bootstrap/env";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST ?? "smtp.hostinger.com",
  port: env.SMTP_PORT ?? 465,
  secure: true,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});
