import mongoose from "mongoose";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../middlewares/handleErrors";
import { IGroup } from "../../../../models/courses/exam/group/dtos";
import {
  Group,
  validateCreateGroup,
  validateUpdateGroup,
} from "../../../../models/courses/exam/group/Group.model";
import { Exam } from "../../../../models/courses/exam/Exam.model";
import { Question } from "../../../../models/courses/exam/question/Question.model";

class GroupService {
  // Create new group
  static async createGroup(groupData: IGroup) {
    const { error } = validateCreateGroup(groupData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (
      !mongoose.Types.ObjectId.isValid(groupData.examId as unknown as string)
    ) {
      throw new BadRequestError("معرف الامتحان غير صالح");
    }

    // Verify exam exists
    const exam = await Exam.findById(groupData.examId);
    if (!exam) throw new NotFoundError("الامتحان غير موجود");

    const group = await Group.create(groupData);
    await group.populate("examId", "title");

    if (!group) throw new NotFoundError("فشل إنشاء المجموعة");

    return { id: group.id, message: "تم إنشاء المجموعة بنجاح" };
  }

  // Get group by ID
  static async getGroupById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    const group = await Group.findById(id)
      .populate("examId", "title")
      .populate({
        path: "questions",
        options: { sort: { createdAt: -1 } }, // Optional: sort questions
      });

    if (!group) throw new NotFoundError("المجموعة غير موجودة");

    return group;
  }

  // Get groups by exam ID with all questions
  static async getGroupsByExamId(examId: string) {
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      throw new BadRequestError("معرف الامتحان غير صالح");
    }

    // Get all groups with their questions populated
    const groups = await Group.find({ examId })
      .populate("examId", "title")
      .populate({
        path: "questions",
        options: { sort: { createdAt: -1 } }, // Optional: sort questions
      });

    if (groups.length === 0) {
      throw new NotFoundError("لا توجد مجموعات لهذا الامتحان");
    }

    // Shuffle groups if needed
    const shuffledGroups = this.shuffleArray([...groups]);

    // Return groups with all their questions (no slicing)
    const groupsWithAllQuestions = shuffledGroups.map((group) => ({
      ...group.toObject(),
      questions: group.questions || [], // Ensure questions array exists
    }));

    return groupsWithAllQuestions;
  }

  // Update group
  static async updateGroup(id: string, groupData: Partial<IGroup>) {
    const { error } = validateUpdateGroup(groupData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    if (
      groupData.examId &&
      !mongoose.Types.ObjectId.isValid(groupData.examId as unknown as string)
    ) {
      throw new BadRequestError("معرف الامتحان غير صالح");
    }

    if (groupData.examId) {
      const examHave = await Exam.findById(groupData.examId);
      if (!examHave) throw new NotFoundError("الامتحان غير موجود");
    }

    const groupHave = await Group.findById(id);
    if (!groupHave) throw new NotFoundError("المجموعة غير موجودة");

    const updatedGroup = await Group.findByIdAndUpdate(id, groupData, {
      new: true,
      runValidators: true,
    });

    if (!updatedGroup) throw new NotFoundError("فشل تحديث المجموعة");

    return { message: "تم تحديث المجموعة بنجاح" };
  }

  // Delete group
  static async deleteGroup(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    const group = await Group.findByIdAndDelete(id);
    if (!group) throw new NotFoundError("المجموعة غير موجودة");
    return { message: "تم حذف المجموعة بنجاح" };
  }

  // Delete groups by exam id
  static async deleteGroupsByExamId(examId: string) {
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      throw new BadRequestError("معرف الامتحان غير صالح");
    }

    const result = await Group.deleteMany({ examId });

    return {
      message: "تم حذف جميع مجموعات الامتحان بنجاح",
      deletedCount: result.deletedCount,
    };
  }

  // Shuffle Array => for make change in group order
  private static shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export { GroupService };
