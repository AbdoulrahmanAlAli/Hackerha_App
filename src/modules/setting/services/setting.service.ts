import { Student } from "../../users/student/models/student.model";

export class SettingService {
  // ~ Patch => /api/hackit/ctrl/setting/reset-students-relations
  static async resetStudentsRelations() {
    const result = await Student.updateMany(
      {},
      {
        $set: {
          enrolledCourses: [],
          banks: [],
          courses: [],
          sessions: [],
          exams: [],
        },
      }
    );

    return {
      message: "تمت العملية بنجاح",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }
}