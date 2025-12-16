import {
    BadRequestError,
    NotFoundError,
  } from "../../../middlewares/handleErrors";
  import { ITeacher } from "../../../models/users/teachers/dtos";
  import {
    Teacher,
    validateCreateTeacher,
    validateLoginTeacher,
  } from "../../../models/users/teachers/Teacher.model";
  import { generateJWT } from "../../../utils/generateToken";
  import bcrypt from "bcrypt";
  
  class AuthTeacherService {
    // ~ Post => /api/univers/ctrl/teacher/register ~ Create New Teacher
    static async createNewTeacher(teacherData: ITeacher) {
      const { error } = validateCreateTeacher(teacherData);
      if (error) {
        throw new BadRequestError(error.details[0].message);
      }
  
      const [existingByPhone, existingByEmail] = await Promise.all([
        Teacher.findOne({ phoneNumber: teacherData.phoneNumber }),
        Teacher.findOne({ email: teacherData.email }),
      ]);
  
      if (existingByPhone) {
        throw new BadRequestError("رقم الهاتف مسجل مسبقاً");
      }
  
      if (existingByEmail) {
        throw new BadRequestError("البريد الإلكتروني مسجل مسبقاً");
      }
  
  
      const teacher = await Teacher.create({
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        phoneNumber: teacherData.phoneNumber,
        gender: teacherData.gender,
        birth: teacherData.birth,
        email: teacherData.email,
        password: teacherData.password,
        about: teacherData.about 
      });

  
      return {
        message:
          "تم إنشاء الحساب بنجاح وتم إرسال بيانات الدخول إلى بريدك الإلكتروني",
        teacherId: teacher._id,
      };
    }
  
    // ~ Post => /api/univers/ctrl/teacher/login ~ Login Teacher
    static async loginTeacher(teacherData: ITeacher) {
      const { error } = validateLoginTeacher(teacherData);
      if (error) {
        throw new BadRequestError(error.details[0].message);
      }
  
      const existingTeacher = await Teacher.findOne({
        email: teacherData.email,
      });
  
      if (!existingTeacher) {
        throw new NotFoundError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }
  
      if (existingTeacher.suspended) {
        throw new BadRequestError(
          "حسابك مقيد. السبب: " + existingTeacher.suspensionReason
        );
      }
  
      const isPasswordValid = await bcrypt.compare(
        teacherData.password,
        existingTeacher.password
      );
  
      if (!isPasswordValid) {
        throw new BadRequestError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }
  
      const token = generateJWT({
        id: existingTeacher.id,
        role: "teacher",
      });
  
      return {
        message: "تم تسجيل الدخول بنجاح",
        token,
      };
    }
  }
  
  export { AuthTeacherService };
  