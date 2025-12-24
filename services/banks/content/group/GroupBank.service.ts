import mongoose from "mongoose";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../middlewares/handleErrors";
import { Content } from "../../../../models/banks/content/Content.model";
import { IGroupBank } from "../../../../models/banks/content/group/dtos";
import {
  GroupBank,
  validateCreateGroupBank,
  validateUpdateGroupBank,
} from "../../../../models/banks/content/group/GroupBank.model";
import { QuestionBank } from "../../../../models/banks/content/question/QuestionBank.model";

class GroupBankService {
  // Create new group bank
  static async createGroupBank(groupData: IGroupBank) {
    const { error } = validateCreateGroupBank(groupData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (
      !mongoose.Types.ObjectId.isValid(groupData.contentId as unknown as string)
    ) {
      throw new BadRequestError("معرف المحتوى غير صالح");
    }

    // Verify content exists
    const content = await Content.findById(groupData.contentId);
    if (!content) throw new NotFoundError("المحتوى غير موجود");

    const groupBank = await GroupBank.create(groupData);
    await groupBank.populate("contentId", "title");

    if (!groupBank) throw new NotFoundError("فشل إنشاء المجموعة");

    return { id: groupBank.id, message: "تم إنشاء المجموعة بنجاح" };
  }

  // Get group Bank by ID
  static async getGroupBankById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    const groupBank = await GroupBank.findById(id)
      .populate("contentId", "title")
      .populate({
        path: "questions" // Optional: sort questions
      });
    if (!groupBank) throw new NotFoundError("المجموعة غير موجودة");

    return groupBank;
  }

  // Get groups Bank by content ID
  static async getGroupsBankByContentId(contentId: string) {
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new BadRequestError("معرف المحتوى غير صالح");
    }

    const allGroupsBank = await GroupBank.find({ contentId })
      .populate("contentId", "title")
      .populate({
        path: "questions" // Optional: sort questions
      });

    if (allGroupsBank.length === 0) {
      throw new NotFoundError("لا توجد مجموعات لهذا الامتحان");
    }

    const shuffledGroupsBank = this.shuffleArray([...allGroupsBank]);

    const groupsWithAllQuestions = shuffledGroupsBank.map((group) => ({
      ...group.toObject(),
      questions: group.questions || [], // Ensure questions array exists
    }));

    return groupsWithAllQuestions;
  }

  // Update group Bank
  static async updateGroupBank(id: string, groupData: Partial<IGroupBank>) {
    const { error } = validateUpdateGroupBank(groupData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    if (
      groupData.contentId &&
      !mongoose.Types.ObjectId.isValid(groupData.contentId as unknown as string)
    ) {
      throw new BadRequestError("معرف المحتوى غير صالح");
    }

    if (groupData.contentId) {
      const contentHave = await Content.findById(groupData.contentId);
      if (!contentHave) throw new NotFoundError("المحتوى غير موجود");
    }

    const groupBankHave = await GroupBank.findById(id);
    if (!groupBankHave) throw new NotFoundError("المجموعة غير موجودة");

    const updatedGroupBank = await GroupBank.findByIdAndUpdate(id, groupData, {
      new: true,
      runValidators: true,
    });

    if (!updatedGroupBank) throw new NotFoundError("فشل تحديث المجموعة");

    return { message: "تم تحديث المجموعة بنجاح" };
  }

  // Delete group Bank
  static async deleteGroupBank(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    const groupBank = await GroupBank.findByIdAndDelete(id);
    if (!groupBank) throw new NotFoundError("المجموعة غير موجودة");
    return { message: "تم حذف المجموعة بنجاح" };
  }

  // Delete groups Bank by content id
  static async deleteGroupsBankByContentId(contentId: string) {
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new BadRequestError("معرف المحتوى غير صالح");
    }

    const result = await GroupBank.deleteMany({ contentId });

    return {
      message: "تم حذف جميع مجموعات المحتوى بنجاح",
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

export { GroupBankService };
