import nodemailer from "nodemailer";
import { EmailOptions } from "./types";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
