import { transporter } from "./transporter";
import type { EmailOptions } from "./mailer.types";
import { env } from "../../bootstrap/env";
import { logger } from "../../bootstrap/logger";

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<void> {
  console.log(
    await transporter.sendMail({
      from: `"Hackerha App" <${env.EMAIL_USER}>`,
      envelope: {
        from: env.EMAIL_USER,
        to,
      },
      to,
      subject,
      text,
      html,
    })
  );

  try {
    await transporter.sendMail({
      from: `"Hackerha App" <${env.EMAIL_USER}>`,
      envelope: {
        from: env.EMAIL_USER,
        to,
      },
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent -> ${to} | ${subject}`);
  } catch (error) {
    logger.error("Failed to send email", error);
    throw new Error("فشل في إرسال البريد الإلكتروني");
  }
}
