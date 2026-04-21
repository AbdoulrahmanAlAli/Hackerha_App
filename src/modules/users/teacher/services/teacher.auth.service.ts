import bcrypt from "bcrypt";
import { Teacher } from "../models/teacher.model";

import {
  badRequest,
  notFound,
  forbidden,
} from "../../../../core/errors/httpErrors";
import {
  CreateTeacherInput,
  createTeacherSchema,
  LoginTeacherInput,
  loginTeacherSchema,
} from "../schemas/teacher.schema";
import { zodFirstMessage } from "../../../../core/http/zodMessage";
import { signAccessToken } from "../../../../shared/security/jwt";
import { ICloudinaryFile } from "../../../../core/types/cloudinary.types";

export class AuthTeacherService {
  // ~ Post => /api/hackit/ctrl/teacher/register ~ Create New Teacher
  static async createNewTeacher(data: CreateTeacherInput, file?: ICloudinaryFile) {
    let parsed: CreateTeacherInput;
    try {
      parsed = createTeacherSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const [byPhone, byEmail] = await Promise.all([
      Teacher.findOne({ phoneNumber: parsed.phoneNumber }).select("_id").lean(),
      Teacher.findOne({ email: parsed.email }).select("_id").lean(),
    ]);

    if (byPhone) throw badRequest("رقم الهاتف مسجل مسبقاً");
    if (byEmail) throw badRequest("البريد الإلكتروني مسجل مسبقاً");


    const teacher = await Teacher.create({
      profilePhoto: file?.path ? file.path : "https://i.postimg.cc/JzCB3CDX/Profile-Picture-Container-(2).png",
      fullName: parsed.fullName,
      phoneNumber: parsed.phoneNumber,
      gender: parsed.gender,
      email: parsed.email,
      password: parsed.password, // سيُشفّر داخل pre-save
      about: parsed.about ?? "",
      percentage: parsed.percentage,
      available: true, // لأن المعلم يُنشأ من النظام
    });

    return {
      message: "تم إنشاء الحساب بنجاح",
      teacherId: teacher.id,
    };
  }

  // ~ Post => /api/hackit/ctrl/teacher/login ~ Login Teacher
  static async loginTeacher(data: LoginTeacherInput) {
    let parsed: LoginTeacherInput;
    try {
      parsed = loginTeacherSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // لأن password عندنا select:false
    const teacher = await Teacher.findOne({ email: parsed.email }).select(
      "+password"
    );
    if (!teacher) throw notFound("البريد الإلكتروني أو كلمة المرور غير صحيحة");

    if (teacher.suspended) {
      throw forbidden(
        `حسابك مقيد. السبب: ${teacher.suspensionReason || "غير معروف"}`
      );
    }

    const ok = await bcrypt.compare(parsed.password, teacher.password);
    if (!ok) throw notFound("البريد الإلكتروني أو كلمة المرور غير صحيحة");

    const token = signAccessToken({ id: teacher.id, role: "teacher", university: "الكل" });

    return { message: "تم تسجيل الدخول بنجاح", token };
  }
}
