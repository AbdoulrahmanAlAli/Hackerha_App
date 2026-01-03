import mongoose from "mongoose";
import { Group } from "../models/group.model";
import { badRequest, notFound } from "../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../core/http/zodMessage";
import {
  createGroupInput,
  createGroupSchema,
  updateGroupInput,
  updateGroupSchema,
} from "../schemas/group.schema";
import { Exam } from "../../models/exam.model";
import { Question } from "../../question/models/question.model";

export class GroupService {
  static async createGroup(data: unknown) {
    let parsed: createGroupInput;
    try {
      parsed = createGroupSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    if (!mongoose.isValidObjectId(parsed.examId))
      throw badRequest("معرف الامتحان غير صالح");

    const exam = await Exam.findById(parsed.examId);
    if (!exam) throw notFound("الامتحان غير موجود");

    const group = await Group.create(parsed);
    await group.populate("examId", "title");

    return { id: group.id, message: "تم إنشاء المجموعة بنجاح" };
  }

  static async getGroupById(id: string) {
    if (!mongoose.isValidObjectId(id))
      throw badRequest("معرف المجموعة غير صالح");

    const group = await Group.findById(id).populate("examId", "title");

    if (!group) throw notFound("المجموعة غير موجودة");
    return group;
  }

  static async getGroupsByExamId(examId: string) {
    if (!mongoose.isValidObjectId(examId))
      throw badRequest("معرف الامتحان غير صالح");

    const groups = await Group.find({ examId }).populate("examId", "title");

    if (groups.length === 0) throw notFound("لا توجد مجموعات لهذا الامتحان");

    const shuffled = GroupService.shuffle([...groups]);

    return shuffled.map((g) => ({
      ...g.toObject(),
      questions: (g as any).questions || [],
    }));
  }

  static async updateGroup(id: string, data: unknown) {
    if (!mongoose.isValidObjectId(id))
      throw badRequest("معرف المجموعة غير صالح");

    let parsed: updateGroupInput;
    try {
      parsed = updateGroupSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    if (parsed.examId && !mongoose.isValidObjectId(parsed.examId))
      throw badRequest("معرف الامتحان غير صالح");

    if (parsed.examId) {
      const exam = await Exam.findById(parsed.examId);
      if (!exam) throw notFound("الامتحان غير موجود");
    }

    const exists = await Group.findById(id);
    if (!exists) throw notFound("المجموعة غير موجودة");

    await Group.findByIdAndUpdate(id, parsed, { runValidators: true });
    return { message: "تم تحديث المجموعة بنجاح" };
  }

  static async deleteGroup(id: string) {
    if (!mongoose.isValidObjectId(id))
      throw badRequest("معرف المجموعة غير صالح");

    // هذا يشغل pre("findOneAndDelete") داخل GroupModel لحذف الأسئلة
    const deleted = await Group.findOneAndDelete({ _id: id });
    if (!deleted) throw notFound("المجموعة غير موجودة");

    return { message: "تم حذف المجموعة بنجاح" };
  }

  static async deleteGroupsByExamId(examId: string) {
    if (!mongoose.isValidObjectId(examId))
      throw badRequest("معرف الامتحان غير صالح");

    // 1) هات كل groupIds
    const groups = await Group.find({ examId }).select("_id").lean();
    const groupIds = groups.map((g) => g._id);

    // 2) احذف كل Questions التابعة لهذه الـ groups
    if (groupIds.length) {
      await Question.deleteMany({ groupId: { $in: groupIds } });
    }

    // 3) احذف كل Groups
    const result = await Group.deleteMany({ examId });

    return {
      message: "تم حذف جميع مجموعات الامتحان بنجاح",
      deletedCount: result.deletedCount ?? 0,
    };
  }

  private static shuffle<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
