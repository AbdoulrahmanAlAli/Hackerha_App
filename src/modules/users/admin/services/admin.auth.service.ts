import bcrypt from "bcrypt";
import { Admin } from "../models/admin.model";
import {
  loginAdminSchema,
  type LoginAdminInput,
} from "../schemas/admin.schemas";
import { unauthorized, badRequest } from "../../../../core/errors/httpErrors";
import { signAccessToken } from "../../../../shared/security/jwt";
import { zodFirstMessage } from "../../../../core/http/zodMessage";

export class AuthAdminService {
  // ~ Post => /api/hackit/ctrl/admin/login ~ Login Admin
  static async loginAdmin(loginData: LoginAdminInput) {
    // Zod validation (بنفس أسلوب Joi: رسالة واحدة)
    let parsed: LoginAdminInput;
    try {
      parsed = loginAdminSchema.parse(loginData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // password عندنا select:false => لازم select("+password")
    const admin = await Admin.findOne({ email: parsed.email }).select(
      "+password"
    );
    if (!admin) {
      throw unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    const isPasswordValid = await bcrypt.compare(
      parsed.password,
      admin.password
    );
    if (!isPasswordValid) {
      throw unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    const token = signAccessToken({
      id: admin.id,
      role: "admin",
      university: "الكل"
    });

    return {
      message: "تم تسجيل الدخول بنجاح",
      token,
    };
  }
}
