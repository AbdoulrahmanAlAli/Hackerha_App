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
      from: `Hacherha App`,
      to,
      subject,
      text,
      html, // Make sure to pass this through
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("فشل في إرسال البريد:", error);
    throw new Error("فشل في إرسال البريد الإلكتروني");
  }
};