import {
  BadRequestError,
  NotFoundError,
} from "../../../middlewares/handleErrors";
import { IOtp, IStudent } from "../../../models/users/students/dtos";
import {
  Student,
  validateUpdateStudent,
  validateSendEmail,
  validateResetPass,
  validatePasswourd,
  validateUpdateSuspendedStudent,
  validateUpdateImportantStudent,
  validateUpdateFcmToken,
  validateUpdateDeviceIdReset,
} from "../../../models/users/students/Student.model";
import { OTPUtils } from "../../../utils/generateOtp";
import { sendEmail } from "../../../utils/mailer";
import { html, resetPasswordHtml } from "../../../utils/mailHtml";
import bcrypt from "bcrypt";
import {
  CheckStudentExistenceParams,
  ExistenceResults,
  ICloudinaryFile,
} from "../../../utils/types";
import { Course } from "../../../models/courses/Course.model";
import mongoose, { Types } from "mongoose";
import { Session } from "../../../models/courses/session/Session.model";
import { Bank } from "../../../models/banks/Bank.model";
import { Content } from "../../../models/banks/content/Content.model";
import { Exam } from "../../../models/courses/exam/Exam.model";

class CtrlStudentService {
  // ~ Get => /api/hackit/ctrl/student ~ Get All Student
  static async getAllStudents(universityNumber?: number) {
    const query: any = {};

    if (universityNumber) {
      query.universityNumber = universityNumber;
    }

    const students = await Student.find(query)
      .select(
        "firstName lastName device_id phoneNumber email universityNumber academicYear gender birth profilePhoto available suspended enrolledCourses createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return students;
  }

  // ~ Get => /api/hackit/ctrl/student/accountprofilestudent ~ Get Profile Student
  static async getProfileStudent(id: string) {
    const existingInactiveById = await Student.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const student = await Student.findById(id).select(
      "-password -otp -suspended -available -resetPass -createdAt -updatedAt -__v -favoriteCourses -favoriteSessions -favoriteBank -enrolledCourses -banks -contents"
    );

    if (!student) {
      throw new NotFoundError("الطالب غير موجود");
    }

    return student;
  }

  // New: get aggregated banks and contents info for a student
  static async getBanksAndContents(studentId: string) {
    const existing = await Student.findById(studentId).populate("contents");

    if (!existing) throw new NotFoundError("الطالب غير موجود");

    // Get banks with counts using aggregation
    const banksWithStats = await this.getBanksWithContentAndQuestionCounts(
      existing.banks.map((bank) => bank._id.toString())
    );

    return {
      banks: banksWithStats,
      contents: existing.contents,
    };
  }

  // New: get enrolled courses with teacher populated
  static async getEnrolledCourses(studentId: string) {
    const existing = await Student.findById(studentId);
    if (!existing) throw new NotFoundError("الطالب غير موجود");

    const student = await Student.findById(studentId)
      .select("enrolledCourses")
      .populate({ path: "enrolledCourses", populate: { path: "teacher" } })
      .lean();

    return student?.enrolledCourses || [];
  }

  // ~ Get => /api/hackit/ctrl/student/favorites/:id ~ Get Favorites Student
  static async getFavoriteStudent(id: string) {
    const student = await Student.findById(id)
      .populate({ path: "favoriteCourses", populate: { path: "teacher" } })
      .populate("favoriteSessions")
      .populate("favoriteBank");

    if (!student) {
      throw new NotFoundError("الطالب غير موجود");
    }

    let favoriteBanksWithStats = [];

    if (student.favoriteBank && student.favoriteBank.length > 0) {
      const favoriteBankIds = student.favoriteBank.map((bank) =>
        bank._id.toString()
      );

      const banksWithStats = await this.getBanksWithContentAndQuestionCounts(
        favoriteBankIds
      );

      favoriteBanksWithStats = banksWithStats;
    }

    return {
      favoriteCourses: student.favoriteCourses,
      favoriteSessions: student.favoriteSessions,
      favoriteBank: favoriteBanksWithStats,
    };
  }

  // ~ Post => /api/hackit/ctrl/student/sendemailpassword ~ Send Email For Password For Student
  static async SendEmailForPasswordStudent(studentData: IStudent) {
    const { error } = validateSendEmail(studentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveByEmail = await Student.findOne({
      email: studentData.email,
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
        subject: "رمز إعادة تعيين كلمة المرور - حساب طالب",
        text: `رمز التحقق الخاص بك لإعادة تعيين كلمة المرور هو: ${otp}`,
        html: resetPasswordHtml(otp), // استخدام التصميم الجديد
      });
    } catch (emailError) {
      console.error("Failed to send reset password email:", emailError);
      throw new Error(
        "فشل في إرسال بريد إعادة تعيين كلمة المرور، يرجى المحاولة مرة أخرى"
      );
    }

    return {
      message: "تم إرسال كود التحقق الخاص بك، يرجى التحقق من بريدك الإلكتروني",
      id: existingInactiveByEmail.id,
    };
  }

  // ~ Post => /api/hackit/ctrl/student/forgetPass/:id ~ Forget Password For Student
  static async ForgetPasswordStudent(studentData: IStudent, id: string) {
    const { error } = validateResetPass(studentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Student.findById(id);
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
      studentData.otp,
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

  // ~ Put => /api/hackit/ctrl/student/changepass/:id ~ Change Password For Student
  static async ChagePasswordStudent(studentData: IStudent, id: string) {
    const { error } = validatePasswourd(studentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Student.findById(id);
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
      studentData.password,
      existingInactiveById.password
    );
    if (isSamePassword) {
      throw new BadRequestError(
        "كلمة السر الجديدة يجب أن تكون مختلفة عن القديمة"
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(studentData.password, salt);

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        $set: {
          password: hashedPassword,
          resetPass: false,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw new Error("فشل تحديث كلمة السر");
    }

    return { message: "تم تحديث كلمة السر بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/updatedetailsprofile/:id ~ Change details of student
  static async UpdateProfileStudent(studentData: IStudent, id: string) {
    const { error } = validateUpdateStudent(studentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Student.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        $set: {
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          phoneNumber: studentData.phoneNumber,
          academicYear: studentData.academicYear,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw new Error("فشل تحديث معلومات الطالب");
    }

    return { message: "تم التحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/UpdateProfileSuspendedStudent/:id ~ Change Suspended of student
  static async UpdateProfileSuspendedStudent(
    studentData: IStudent,
    id: string
  ) {
    console.log("here");

    const { error } = validateUpdateSuspendedStudent(studentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Student.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        $set: {
          suspended: studentData.suspended,
          suspensionReason: studentData.suspensionReason,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw new Error("فشل في تقييد الحساب");
    }

    return { message: "تم تحديث تقييد الحساب بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/UpdateProfileImpStudentAdmin/:id ~ Change important details of student
  static async UpdateProfileImpStudentAdmin(studentData: IStudent, id: string) {
    const { error } = validateUpdateImportantStudent(studentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingInactiveById = await Student.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        $set: {
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          phoneNumber: studentData.phoneNumber,
          academicYear: studentData.academicYear,
          universityNumber: studentData.universityNumber,
          gender: studentData.gender,
          birth: studentData.birth,
          email: studentData.email,
          device_id: studentData.device_id,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw new Error("فشل تحديث معلومات الطالب");
    }

    return { message: "تم التحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/updateimageprofile/:id ~ Change Image of student
  static async UpdateImageProfileStudent(file: ICloudinaryFile, id: string) {
    const existingInactiveById = await Student.findById(id);
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

    const updatedStudent = await Student.findByIdAndUpdate(
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

    if (!updatedStudent) {
      throw new Error("فشل تحديث صورة الملف الشخصي");
    }

    return {
      message: "تم تحديث صورة الملف الشخصي بنجاح",
    };
  }

  // ~ Delete => /api/hackit/ctrl/student/account/:id ~ Delete Student Account
  static async DeleteStudentAccount(id: string) {
    const existingInactiveById = await Student.findById(id);
    if (!existingInactiveById) {
      throw new BadRequestError("المستخدم غير موجود");
    }

    if (!existingInactiveById.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingInactiveById.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    const deleteAccount = await Student.findByIdAndDelete(id);

    if (!deleteAccount) {
      throw new Error("فشل في حذف الحساب");
    }

    return {
      message: "تم حذف الحساب بنجاح",
    };
  }

  // ~ patch /api/hackit/ctrl/student/favorite/course/:courseId/toggle/:id
  static async toggleFavoriteCourse(
    studentId: string,
    courseId: string
  ): Promise<{ message: string; action: "added" | "removed" }> {
    const student = await Student.findById(studentId);
    if (!student) throw new NotFoundError("الطالب غير موجود");

    const course = await Course.findById(courseId);
    if (!course) throw new NotFoundError("الكورس غير موجود");

    const courseObjectId = new Types.ObjectId(courseId);
    const index = student.favoriteCourses.indexOf(courseObjectId);

    let action: "added" | "removed";

    if (index === -1) {
      // إضافة إلى المفضلة
      student.favoriteCourses.push(courseObjectId);
      action = "added";
    } else {
      // إزالة من المفضلة
      student.favoriteCourses.splice(index, 1);
      action = "removed";
    }

    await student.save();

    return {
      message:
        action === "added"
          ? "تمت إضافة الكورس إلى المفضلة"
          : "تمت إزالة الكورس من المفضلة",
      action,
    };
  }

  // ~ patch /api/hackit/ctrl/student/favorite/session/:sessionId/toggle/:id
  static async toggleFavoriteSession(
    studentId: string,
    sessionId: string
  ): Promise<{
    message: string;
    action: "added" | "removed";
  }> {
    const student = await Student.findById(studentId);
    if (!student) throw new NotFoundError("الطالب غير موجود");

    const session = await Session.findById(sessionId);
    if (!session) throw new NotFoundError("الجلسة غير موجودة");

    const sessionObjectId = new Types.ObjectId(sessionId);
    const index = student.favoriteSessions.indexOf(sessionObjectId);

    let action: "added" | "removed";

    if (index === -1) {
      // إضافة إلى المفضلة
      student.favoriteSessions.push(sessionObjectId);
      action = "added";
    } else {
      // إزالة من المفضلة
      student.favoriteSessions.splice(index, 1);
      action = "removed";
    }

    await student.save();

    return {
      message:
        action === "added"
          ? "تمت إضافة الجلسة إلى المفضلة"
          : "تمت إزالة الجلسة من المفضلة",
      action,
    };
  }

  // ~ patch /api/hackit/ctrl/student/favorite/bank/:bankId/toggle/:id
  static async toggleFavoriteBank(
    studentId: string,
    bankId: string
  ): Promise<{
    message: string;
    action: "added" | "removed";
  }> {
    const student = await Student.findById(studentId);
    if (!student) throw new NotFoundError("الطالب غير موجود");

    const bank = await Bank.findById(bankId);
    if (!bank) throw new NotFoundError("البنك غير موجودة");

    const bankObjectId = new Types.ObjectId(bankId);
    const index = student.favoriteBank.indexOf(bankObjectId);

    let action: "added" | "removed";

    if (index === -1) {
      // إضافة إلى المفضلة
      student.favoriteBank.push(bankObjectId);
      action = "added";
    } else {
      // إزالة من المفضلة
      student.favoriteBank.splice(index, 1);
      action = "removed";
    }

    await student.save();

    return {
      message:
        action === "added"
          ? "تمت إضافة البنك إلى المفضلة"
          : "تمت إزالة البنك من المفضلة",
      action,
    };
  }

  // ~ Get => /api/hackit/ctrl/student/check-existence ~ Check if phone, email, or university number exists
  static async checkStudentExistence(
    checkData: CheckStudentExistenceParams
  ): Promise<ExistenceResults> {
    const { phoneNumber, email, universityNumber } = checkData;

    // Validate that at least one field is provided
    if (!phoneNumber && !email && !universityNumber) {
      throw new BadRequestError(
        "يجب تقديم رقم الهاتف أو البريد الإلكتروني أو الرقم الجامعي للتحقق"
      );
    }

    const existenceResults: ExistenceResults = {};

    // Check email existence if provided
    if (email) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError("صيغة البريد الإلكتروني غير صحيحة");
      }

      const emailExists = await Student.findOne({
        email,
        available: true,
      })
        .select("_id")
        .lean();

      existenceResults.emailExists = !!emailExists;
    }

    // Check phone number existence if provided
    if (phoneNumber) {
      const phoneNumberExists = await Student.findOne({
        phoneNumber,
        available: true,
      })
        .select("_id")
        .lean();

      existenceResults.phoneNumberExists = !!phoneNumberExists;
    }

    // Check university number existence if provided
    if (universityNumber) {
      // Optional: Add university number validation
      if (universityNumber <= 0) {
        throw new BadRequestError("الرقم الجامعي يجب أن يكون رقمًا موجبًا");
      }

      const universityNumberExists = await Student.findOne({
        universityNumber,
        available: true,
      })
        .select("_id")
        .lean();

      existenceResults.universityNumberExists = !!universityNumberExists;
    }

    return existenceResults;
  }

  // ~ Patch => /api/hackit/ctrl/student/bank/:bankId/content/:contentId/user/:id ~ Add bank and content for student
  static async addBankAndContentForStudent(
    id: string,
    bankid: string,
    contentid: string
  ) {
    // البحث بشكل متوازي لتحسين الأداء
    const [student, bank, content] = await Promise.all([
      Student.findById(id),
      Bank.findById(bankid),
      Content.findById(contentid),
    ]);

    if (!student) throw new NotFoundError("الطالب غير موجود");
    if (!bank) throw new NotFoundError("البنك غير موجود");
    if (!content) throw new NotFoundError("المحتوى غير موجود");

    // التحقق من أن المحتوى ينتمي للبنك
    if (!content.bank.equals(bank._id as string)) {
      throw new BadRequestError("المحتوى لا ينتمي للبنك المحدد");
    }

    // التحديث بشكل متوازي
    await Promise.all([
      Student.findByIdAndUpdate(
        id,
        { $addToSet: { banks: bankid } },
        { new: true }
      ),
      Student.findByIdAndUpdate(
        id,
        { $addToSet: { contents: contentid } },
        { new: true }
      ),
    ]);

    return {
      message: "تم تحديث البيانات بنجاح",
    };
  }

  // ~ Patch => /api/hackit/ctrl/student/course/:courseId/session/:sessionId/user/:id ~ Add course and session for student
  static async addCourseAndSessionForStudent(
    id: string,
    courseid: string,
    sessionid: string
  ) {
    const [student, course, session] = await Promise.all([
      Student.findById(id),
      Course.findById(courseid),
      Session.findById(sessionid),
    ]);

    if (!student) throw new NotFoundError("الطالب غير موجود");
    if (!course) throw new NotFoundError("الكورس غير موجود");
    if (!session) throw new NotFoundError("الجلسة غير موجودة");

    // التحقق من أن الجلسة تنتمي للكورس
    if (!session.courseId.equals(course._id as string)) {
      throw new BadRequestError("الجلسة لا تنتمي للكورس المحدد");
    }

    // التحديث بشكل متوازي
    await Promise.all([
      Student.findByIdAndUpdate(
        id,
        { $addToSet: { courses: courseid } },
        { new: true }
      ),
      Student.findByIdAndUpdate(
        id,
        { $addToSet: { sessions: sessionid } },
        { new: true }
      ),
    ]);

    return {
      message: "تم تحديث البيانات بنجاح",
    };
  }

  // ~ Patch => /api/hackit/ctrl/student/course/:courseId/exam/:examId/user/:id ~ Add course and exam for student
  static async addCourseAndExamForStudent(
    id: string,
    courseid: string,
    examid: string
  ) {
    const [student, course, exam] = await Promise.all([
      Student.findById(id),
      Course.findById(courseid),
      Exam.findById(examid),
    ]);

    if (!student) throw new NotFoundError("الطالب غير موجود");
    if (!course) throw new NotFoundError("الكورس غير موجود");
    if (!exam) throw new NotFoundError("الامتحان غير موجودة");

    // التحقق من أن الامتحان تنتمي للكورس
    if (!exam.courseId.equals(course._id as string)) {
      throw new BadRequestError("الامتحان لا تنتمي للكورس المحدد");
    }

    // التحديث بشكل متوازي
    await Promise.all([
      Student.findByIdAndUpdate(
        id,
        { $addToSet: { courses: courseid } },
        { new: true }
      ),
      Student.findByIdAndUpdate(
        id,
        { $addToSet: { exams: examid } },
        { new: true }
      ),
    ]);

    return {
      message: "تم تحديث البيانات بنجاح",
    };
  }

  // ~ Get => /api/hackit/ctrl/student/favorites/check/:id ~ Check if item is in student favorites using query
  static async checkFavoriteItem(
    studentId: string,
    courseId?: string,
    sessionId?: string,
    bankId?: string
  ): Promise<boolean> {
    // Validate that exactly one ID is provided
    const providedIds = [courseId, sessionId, bankId].filter(Boolean);
    if (providedIds.length !== 1) {
      throw new BadRequestError(
        "يجب تقديم معرف واحد فقط (كورس أو جلسة أو بنك)"
      );
    }

    // Get student with favorite arrays
    const student = await Student.findById(studentId)
      .select("favoriteCourses favoriteSessions favoriteBank")
      .lean();

    if (!student) {
      throw new NotFoundError("الطالب غير موجود");
    }

    // Convert favorite arrays to string sets for fast lookup
    const favoriteCourseIds = new Set(
      student.favoriteCourses.map((id) => id.toString())
    );
    const favoriteSessionIds = new Set(
      student.favoriteSessions.map((id) => id.toString())
    );
    const favoriteBankIds = new Set(
      student.favoriteBank.map((id) => id.toString())
    );

    // Check based on provided ID type
    if (courseId) {
      // Verify course exists
      const course = await Course.findById(courseId).select("_id").lean();
      if (!course) {
        throw new NotFoundError("الكورس غير موجود");
      }
      return favoriteCourseIds.has(courseId);
    }

    if (sessionId) {
      // Verify session exists
      const session = await Session.findById(sessionId).select("_id").lean();
      if (!session) {
        throw new NotFoundError("الجلسة غير موجودة");
      }
      return favoriteSessionIds.has(sessionId);
    }

    if (bankId) {
      // Verify bank exists
      const bank = await Bank.findById(bankId).select("_id").lean();
      if (!bank) {
        throw new NotFoundError("البنك غير موجود");
      }
      return favoriteBankIds.has(bankId);
    }

    return false;
  }

  // get Banks With Content And Question Counts
  static async getBanksWithContentAndQuestionCounts(bankIds: string[]) {
    const result = await Bank.aggregate([
      {
        $match: {
          _id: { $in: bankIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      {
        $lookup: {
          from: "contents",
          localField: "_id",
          foreignField: "bank",
          as: "contents",
        },
      },
      {
        $lookup: {
          from: "groupbanks",
          localField: "contents._id",
          foreignField: "contentId",
          as: "allGroups",
        },
      },
      {
        $lookup: {
          from: "questionbanks",
          localField: "allGroups._id",
          foreignField: "groupBankId",
          as: "allQuestions",
        },
      },
      {
        $addFields: {
          contentsCount: { $size: "$contents" },
          totalQuestionsCount: { $size: "$allQuestions" },
        },
      },
      {
        $project: {
          contents: 0,
          allGroups: 0,
          allQuestions: 0,
        },
      },
    ]);

    return result;
  }

  // ~ Put => /api/hackit/ctrl/student/update-fcm-token/:id ~ Update FCM Token For Student
  static async updateFcmToken(studentData: Partial<IStudent>, id: string) {
    const { error } = validateUpdateFcmToken(studentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      throw new NotFoundError("الطالب غير موجود");
    }

    if (!existingStudent.available) {
      throw new BadRequestError("الحساب غير مفعل");
    }

    if (existingStudent.suspended) {
      throw new BadRequestError("حسابك مقيد");
    }

    // تحديث FCM Token فقط
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        $set: {
          fcmToken: studentData.fcmToken || null,
        },
      },
      { new: true, runValidators: true }
    ).select("_id fcmToken");

    if (!updatedStudent) {
      throw new Error("فشل تحديث");
    }

    return {
      message: "تم تحديث بنجاح",
    };
  }

  // ~ Put => /api/hackit/ctrl/student/update-device-id-reset/:id ~ Update device_id_reset For Student (Admin Only)
  static async updateDeviceIdReset(studentData: Partial<IStudent>, id: string) {
    const { error } = validateUpdateDeviceIdReset(studentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      throw new NotFoundError("الطالب غير موجود");
    }

    // تحديث device_id_reset فقط
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        $set: {
          device_id_reset: studentData.device_id_reset,
        },
      },
      { new: true, runValidators: true }
    ).select("_id device_id_reset");

    if (!updatedStudent) {
      throw new Error("فشل تحديث device_id_reset");
    }

    return {
      message: "تم تحديث device_id_reset بنجاح",
      device_id_reset: updatedStudent.device_id_reset,
    };
  }
}

export { CtrlStudentService };
