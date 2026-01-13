import type { EmailOptions } from "./mailer.types";
import { env } from "../../bootstrap/env";
import { logger } from "../../bootstrap/logger";
import { transporter } from "./transporter";

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"Hackerha App" <${process.env.EMAIL_USER}>`,
      envelope: {
        from: process.env.EMAIL_USER,
        to,
      },
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("فشل في إرسال البريد:", error);
    throw new Error("فشل في إرسال البريد الإلكتروني");
  }
};
