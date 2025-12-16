import {
  BadRequestError,
  NotFoundError,
} from "../../../middlewares/handleErrors";
import { IAdmin } from "../../../models/users/admins/dtos";
import {
  Admin,
  validateCreateAdmin,
  validateUpdateAdmin,
} from "../../../models/users/admins/Admin.model";
import { generateJWT } from "../../../utils/generateToken";
import bcrypt from "bcrypt";

class CtrlAdminService {
  // ~ Get => /api/hackit/ctrl/admin/admin/profile/:id ~ Get Admin Profile
  static async getProfile(id: string) {
    if (!id) {
      throw new BadRequestError("معرف المسؤول مطلوب");
    }

    const admin = await Admin.findById(id).select("-password");
    if (!admin) {
      throw new NotFoundError("المسؤول غير موجود");
    }

    return admin;
  }

  // ~ Post => /api/hackit/ctrl/admin/create ~ Create New Admin
  static async createNewAdmin(adminData: IAdmin) {
    const { error } = validateCreateAdmin(adminData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const [existingByPhone, existingByEmail, existingByUsername] =
      await Promise.all([
        Admin.findOne({
          phoneNumber: adminData.phoneNumber,
        }),
        Admin.findOne({
          email: adminData.email,
        }),
        Admin.findOne({
          firstName: adminData.firstName,
          lastName: adminData.lastName,
        }),
      ]);

    if (existingByPhone) {
      throw new BadRequestError("رقم الهاتف مسجل مسبقاً");
    }

    if (existingByEmail) {
      throw new BadRequestError("البريد الإلكتروني مسجل مسبقاً");
    }

    if (existingByUsername) {
      throw new BadRequestError("اسم المستخدم مسجل مسبقاً");
    }

    const admin = await Admin.create(adminData);

    const token = generateJWT({
      id: admin.id,
      role: "admin",
    });

    return {
      message: "تم إنشاء الحساب بنجاح",
      token,
      admin: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
      },
    };
  }

  // ~ Get => /api/hackit/ctrl/admin/:id ~ Get Admin By ID
  static async getAdminById(id: string) {
    const admin = await Admin.findById(id).select("-password");
    if (!admin) {
      throw new NotFoundError("المسؤول غير موجود");
    }

    return admin;
  }

  // ~ Get => /api/hackit/ctrl/admin/ ~ Get All Admins
  static async getAllAdmins() {
    const admins = await Admin.find()
      .select("-password")
      .sort({ createdAt: -1 });
    return admins;
  }

  // ~ Put => /api/hackit/ctrl/admin/:id ~ Update Admin
  static async updateAdmin(id: string, adminData: Partial<IAdmin>) {
    const { error } = validateUpdateAdmin(adminData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingAdmin = await Admin.findById(id);
    if (!existingAdmin) {
      throw new NotFoundError("المسؤول غير موجود");
    }

    // Check for duplicate email
    if (adminData.email) {
      const existingEmail = await Admin.findOne({
        email: adminData.email,
        _id: { $ne: id },
      });
      if (existingEmail)
        throw new BadRequestError("البريد الإلكتروني موجود مسبقاً");
    }

    // Check for duplicate phone number
    if (adminData.phoneNumber) {
      const existingPhone = await Admin.findOne({
        phoneNumber: adminData.phoneNumber,
        _id: { $ne: id },
      });
      if (existingPhone) throw new BadRequestError("رقم الهاتف موجود مسبقاً");
    }

    // Check for duplicate username
    if (adminData.firstName && adminData.lastName) {
      const existingUsername = await Admin.findOne({
        userName: adminData.firstName,
        lastName: adminData.lastName,
        _id: { $ne: id },
      });
      if (existingUsername)
        throw new BadRequestError("اسم المستخدم موجود مسبقاً");
    }

    // Hash password if provided
    let updateData = { ...adminData };
    if (adminData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(adminData.password, salt);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedAdmin) throw new NotFoundError("فشل تحديث المسؤول");

    return {
      message: "تم تحديث المسؤول بنجاح",
      admin: updatedAdmin,
    };
  }

  // ~ Delete => /api/hackit/ctrl/admin/:id ~ Delete Admin
  static async deleteAdmin(id: string) {
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) throw new NotFoundError("المسؤول غير موجود");

    return { message: "تم حذف المسؤول بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/admin/:id/change-password ~ Change Password
  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ) {
    const admin = await Admin.findById(id);
    if (!admin) throw new NotFoundError("المسؤول غير موجود");

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isCurrentPasswordValid)
      throw new BadRequestError("كلمة المرور الحالية غير صحيحة");

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { password: hashedNewPassword },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedAdmin) throw new NotFoundError("فشل تغيير كلمة المرور");

    return { message: "تم تغيير كلمة المرور بنجاح" };
  }
}

export { CtrlAdminService };
