import bcrypt from "bcrypt";
import { Admin } from "../models/admin.model";
import type { IAdmin } from "../types/admin.types";
import {
  createAdminSchema,
  getAdminsQuerySchema,
  updateAdminSchema,
  type CreateAdminInput,
  type UpdateAdminInput,
} from "..//schemas/admin.schemas";
import { badRequest, notFound } from "../../../../core/errors/httpErrors";
import { signAccessToken } from "../../../../shared/security/jwt";
import { zodFirstMessage } from "../../../../core/http/zodMessage";

export class AdminService {
  // ~ Get => /api/hackit/ctrl/admin/admin/profile/:id ~ Get Admin Profile
  static async getProfile(id: string) {
    if (!id) throw badRequest("معرف المسؤول مطلوب");

    const admin = await Admin.findById(id); // password select:false افتراضيًا
    if (!admin) throw notFound("المسؤول غير موجود");

    return admin;
  }

  // ~ Post => /api/hackit/ctrl/admin/create ~ Create New Admin
  static async createNewAdmin(adminData: CreateAdminInput) {
    let parsed: CreateAdminInput;
    try {
      parsed = createAdminSchema.parse(adminData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const [existingByPhone, existingByEmail, existingByUsername] =
      await Promise.all([
        Admin.findOne({ phoneNumber: parsed.phoneNumber }),
        Admin.findOne({ email: parsed.email }),
        Admin.findOne({
          fullName: parsed.fullName
        }),
      ]);

    if (existingByPhone) throw badRequest("رقم الهاتف مسجل مسبقاً");
    if (existingByEmail) throw badRequest("البريد الإلكتروني مسجل مسبقاً");
    if (existingByUsername) throw badRequest("اسم المستخدم مسجل مسبقاً");

    const admin = await Admin.create(parsed);

    const token = signAccessToken({ id: admin.id, role: admin.role, university: "الكل" });

    return {
      message: "تم إنشاء الحساب بنجاح",
      token,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
      },
    };
  }

  // ~ Get => /api/hackit/ctrl/admin/:id ~ Get Admin By ID
  static async getAdminById(id: string) {
    const admin = await Admin.findById(id);
    if (!admin) throw notFound("المسؤول غير موجود");
    return admin;
  }

  // ~ Get => /api/hackit/ctrl/admin/ ~ Get All Admins
  static async getAllAdmins(query?: any) {
    let parsed: any;
    try {
      parsed = getAdminsQuerySchema.parse(query || {});
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const { role } = parsed;
    const filter: any = {};

    // Apply role filter if provided
    if (role) filter.role = role;

    return Admin.find(filter).sort({ createdAt: -1 }).select("-__v");
  }
  
  // ~ Put => /api/hackit/ctrl/admin/:id ~ Update Admin
  static async updateAdmin(id: string, adminData: Partial<IAdmin>) {
    let parsed: UpdateAdminInput;
    try {
      parsed = updateAdminSchema.parse(adminData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const admin = await Admin.findById(id).select("+password");
    if (!admin) throw notFound("المسؤول غير موجود");

    // Duplicate email
    if (parsed.email) {
      const existingEmail = await Admin.findOne({
        email: parsed.email,
        _id: { $ne: id },
      });
      if (existingEmail) throw badRequest("البريد الإلكتروني موجود مسبقاً");
    }

    // Duplicate phone
    if (parsed.phoneNumber) {
      const existingPhone = await Admin.findOne({
        phoneNumber: parsed.phoneNumber,
        _id: { $ne: id },
      });
      if (existingPhone) throw badRequest("رقم الهاتف موجود مسبقاً");
    }

    // Duplicate username (firstName + lastName) فقط إذا الاثنين موجودين
    if (parsed.fullName) {
      const existingUsername = await Admin.findOne({
        fullName: parsed.fullName,
        _id: { $ne: id },
      });
      if (existingUsername) throw badRequest("اسم المستخدم موجود مسبقاً");
    }

    // تحديث الحقول الموجودة فقط
    if (parsed.fullName) admin.fullName = parsed.fullName;
    if (parsed.email) admin.email = parsed.email;
    if (parsed.phoneNumber) admin.phoneNumber = parsed.phoneNumber;

    // كلمة المرور: set + save لتفعيل pre-save hash
    if (parsed.password) admin.password = parsed.password;

    await admin.save();

    const updated = await Admin.findById(id);
    if (!updated) throw notFound("فشل تحديث المسؤول");

    return {
      message: "تم تحديث المسؤول بنجاح",
      admin: updated,
    };
  }

  // ~ Delete => /api/hackit/ctrl/admin/:id ~ Delete Admin
  static async deleteAdmin(id: string) {
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) throw notFound("المسؤول غير موجود");
    return { message: "تم حذف المسؤول بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/admin/:id/change-password ~ Change Password
  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ) {
    if (!currentPassword) throw badRequest("كلمة المرور الحالية مطلوبة");
    if (!newPassword) throw badRequest("كلمة المرور الجديدة مطلوبة");

    const admin = await Admin.findById(id).select("+password");
    if (!admin) throw notFound("المسؤول غير موجود");

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isCurrentPasswordValid)
      throw badRequest("كلمة المرور الحالية غير صحيحة");

    admin.password = newPassword; // pre-save hook سيعمل hash
    await admin.save();

    return { message: "تم تغيير كلمة المرور بنجاح" };
  }
}
