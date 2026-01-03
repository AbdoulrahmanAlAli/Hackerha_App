import crypto from "crypto";
import bcrypt from "bcrypt";
import { env } from "../../bootstrap/env";

export class OTPUtils {
  private static saltRounds(): number {
    return env.BCRYPT_SALT_ROUNDS ?? 10;
  }

  static generateOTP(): string {
    const buffer = crypto.randomBytes(3);
    const otpValue = buffer.readUIntBE(0, 3) % 100000;
    return otpValue.toString().padStart(5, "0");
  }

  static async encryptOTP(otp: string): Promise<string> {
    if (!otp || otp.length !== 5) {
      throw new Error("يجب أن يكون OTP مكون من 5 خانات");
    }
    const pepper = env.OTP_PEPPER ?? "";
    return bcrypt.hash(otp + pepper, this.saltRounds());
  }

  static async verifyOTP(otp: string, hash: string): Promise<boolean> {
    const pepper = env.OTP_PEPPER ?? "";
    return bcrypt.compare(otp + pepper, hash);
  }
}
