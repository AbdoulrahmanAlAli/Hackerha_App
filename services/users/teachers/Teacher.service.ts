import {
  BadRequestError,
  NotFoundError,
} from "../../../middlewares/handleErrors";
import { IOtp, ITeacher } from "../../../models/users/teachers/dtos";
import {
  Teacher,
  validateUpdateTeacher,
  validateSendEmail,
  validateResetPassword,
  validatePassword,
  validateUpdateSuspendedTeacher,
  validateUpdateImportantTeacher,
} from "../../../models/users/teachers/Teacher.model";
import { OTPUtils } from "../../../utils/generateOtp";
import { sendEmail } from "../../../utils/mailer";
import { html } from "../../../utils/mailHtml";
import bcrypt from "bcrypt";
import { ICloudinaryFile } from "../../../utils/types";
import { Course } from "../../../models/courses/Course.model";
import mongoose, { Types } from "mongoose";
import { Session } from "../../../models/courses/session/Session.model";
import { Bank } from "../../../models/banks/Bank.model";
import { Student } from "../../../models/users/students/Student.model";

class CtrlTeacherService {
  // ~ Get => /api/hackit/ctrl/teacher/accountprofileteacher ~ Get Profile Teacher
  static async getProfileTeacher(id: string) {
    const existingInactiveById = await Teacher.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const teacher = await Teacher.findById(id).select(
      "-password -otp -suspended -available -resetPass -createdAt -updatedAt -__v"
    );

    return teacher;
  }

  // ~ Get => /api/hackit/ctrl/teachers ~ Get Profile Teacher
  static async getTeachers() {
    const teachers = await Teacher.find();

    if (!teachers) {
      throw new NotFoundError("لا يوجد معلمين");
    }

    return teachers;
  }

  // ~ Post => /api/hackit/ctrl/teacher/sendemailpassword ~ Send Email For Password For Teacher
  static async SendEmailForPasswordTeacher(teacherData: ITeacher) {
    const { error } = validateSendEmail(teacherData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveByEmail = await Teacher.findOne({
      email: teacherData.email,
      available: true,
    });
    if (!existingInactiveByEmail) {
      throw new BadRequestError("البريد الإلكتروني غير موجود");
    }

    if (!existingInactiveByEmail.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveByEmail.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const otp = OTPUtils.generateOTP();
    const hashedOtp = await OTPUtils.encryptOTP(otp);

    existingInactiveByEmail.otp = hashedOtp;
    existingInactiveByEmail.resetPass = false;
    await existingInactiveByEmail.save();

    try {
      await sendEmail({
        to: existingInactiveByEmail.email,
        subject: "رمز اعادة تعيين كلمة السر - حساب معلم",
        text: `رمز التحقق الخاص بك هو: ${otp}`,
        html: html(otp),
      });
    } catch (emailError) {
      await Teacher.findByIdAndDelete(existingInactiveByEmail._id);
      console.error("Failed to send email:", emailError);
      throw new Error("فشل في إرسال بريد التحقق، يرجى المحاولة مرة أخرى");
    }

    return {
      message: "تم إرسال كود التحقق الخاص بك، يرجى التحقق من بريدك الإلكتروني",
      id: existingInactiveByEmail.id,
    };
  }

  // ~ Post => /api/hackit/ctrl/teacher/forgetPass/:id ~ Forget Password For Teacher
  static async ForgetPasswordTeacher(teacherData: ITeacher, id: string) {
    const { error } = validateResetPassword(teacherData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Teacher.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const isValidOtp = await OTPUtils.verifyOTP(
      teacherData.otp,
      existingInactiveById.otp
    );
    if (!isValidOtp) {
      throw new BadRequestError("رمز التحقق غير صحيح");
    }

    existingInactiveById.otp = "";
    existingInactiveById.resetPass = true;
    await existingInactiveById.save();

    return { message: "تم التحقق من الكود" };
  }

  // ~ Put => /api/hackit/ctrl/teacher/changepass/:id ~ Change Password For Teacher
  static async ChagePasswordTeacher(teacherData: ITeacher, id: string) {
    const { error } = validatePassword(teacherData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Teacher.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    if (!existingInactiveById.resetPass) {
      throw new BadRequestError("غير مسموح لك بتغيير كلمة السر");
    }

    const isSamePassword = await bcrypt.compare(
      teacherData.password,
      existingInactiveById.password
    );
    if (isSamePassword) {
      throw new BadRequestError(
        "كلمة السر الجديدة يجب أن تكون مختلفة عن القديمة"
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(teacherData.password, salt);

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      {
        $set: {
          password: hashedPassword,
          resetPass: false,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedTeacher) {
      throw new Error("فشل تحديث كلمة السر");
    }

    return { message: "تم تحديث كلمة السر بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/teacher/updatedetailsprofile/:id ~ Change details of teacher
  static async UpdateProfileTeacher(teacherData: ITeacher, id: string) {
    const { error } = validateUpdateTeacher(teacherData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Teacher.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      {
        $set: {
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          phoneNumber: teacherData.phoneNumber,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedTeacher) {
      throw new Error("فشل تحديث معلومات المعلم");
    }

    return { message: "تم التحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/teacher/UpdateProfileSuspendedTeacher/:id ~ Change Suspended of teacher
  static async UpdateProfileSuspendedTeacher(
    teacherData: ITeacher,
    id: string
  ) {
    const { error } = validateUpdateSuspendedTeacher(teacherData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Teacher.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      {
        $set: {
          suspended: teacherData.suspended,
          suspensionReason: teacherData.suspensionReason,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedTeacher) {
      throw new Error("فشل في تقييد الحساب");
    }

    return { message: "تم تقييد الحساب بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/teacher/UpdateProfileImpTeacherAdmin/:id ~ Change important details of teacher
  static async UpdateProfileImpTeacherAdmin(teacherData: ITeacher, id: string) {
    const { error } = validateUpdateImportantTeacher(teacherData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Teacher.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      {
        $set: {
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          phoneNumber: teacherData.phoneNumber,
          gender: teacherData.gender,
          birth: teacherData.birth,
          email: teacherData.email,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedTeacher) {
      throw new Error("فشل تحديث معلومات المعلم");
    }

    return { message: "تم التحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/teacher/updateimageprofile/:id ~ Change Image of teacher
  static async UpdateImageProfileTeacher(file: ICloudinaryFile, id: string) {
    const existingInactiveById = await Teacher.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    console.log(file);

    if (!file) {
      throw new BadRequestError("صورة الملف الشخصي مطلوبة");
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      {
        $set: {
          profilePhoto: file.path,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTeacher) {
      throw new Error("فشل تحديث صورة الملف الشخصي");
    }

    return {
      message: "تم تحديث صورة الملف الشخصي بنجاح",
    };
  }

  // ~ Delete => /api/hackit/ctrl/teacher/account/:id ~ Delete Teacher Account
  static async DeleteTeacherAccount(id: string) {
    const existingInactiveById = await Teacher.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const deleteAccount = await Teacher.findByIdAndDelete(id);

    if (!deleteAccount) {
      throw new Error("فشل في حذف الحساب");
    }

    return {
      message: "تم حذف الحساب بنجاح",
    };
  }

  // ~ Patch => /api/hackit/ctrl/teacher/removeStudent/:id ~ Remove Student From Teacher`s Course
  static async RemoveStudentFromCourse(
    teacherId: string,
    courseId: string,
    studentId: string
  ) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) throw new NotFoundError("المعلم غير موجود");

    const course = await Course.findById(courseId);
    if (!course) throw new NotFoundError("الكورس غير موجود");

    const student = await Student.findById(studentId);
    if (!student) throw new NotFoundError("الطالب غير موجود");

    if (course.teacher.toString() !== teacherId) {
      throw new BadRequestError("هذا الكورس لا ينتمي إلى هذا المعلم");
    }

    if (!student.enrolledCourses.includes(course._id as any)) {
      throw new BadRequestError("الطالب غير مسجل في هذا الكورس");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Student.findByIdAndUpdate(
        studentId,
        { $pull: { enrolledCourses: courseId } },
        { session, new: true }
      );

      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { students: studentId } },
        { session, new: true }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        message: "تم إزالة الطالب من الكورس بنجاح",
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

export { CtrlTeacherService };
