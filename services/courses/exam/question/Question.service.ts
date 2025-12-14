import mongoose from "mongoose";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../middlewares/handleErrors";
import { ICloudinaryFile } from "../../../../utils/types";
import { IQuestion } from "../../../../models/courses/exam/question/dtos";
import {
  Question,
  validateCreateQuestion,
  validateUpdateQuestion,
} from "../../../../models/courses/exam/question/Question.model";
import { Group } from "../../../../models/courses/exam/group/Group.model";

class QuestionService {
  // Create new question
  static async createQuestion(questionData: IQuestion, file?: ICloudinaryFile) {
    const { error } = validateCreateQuestion(questionData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (
      !mongoose.Types.ObjectId.isValid(
        questionData.groupId as unknown as string
      )
    ) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    // Verify group exists
    const group = await Group.findById(questionData.groupId);
    if (!group) throw new NotFoundError("المجموعة غير موجودة");

    if (group.mainTitle === null) {
      const existingQuestions = await Question.find({
        groupId: questionData.groupId,
      });
      if (existingQuestions.length >= 1) {
        throw new BadRequestError("لا يمكن إضافة أكثر من سؤال واحد");
      }
    }

    // Validate that at least one answer is correct
    const hasCorrectAnswer = questionData.answers.some(
      (answer) => answer.correct
    );
    if (!hasCorrectAnswer) {
      throw new BadRequestError(
        "يجب أن تحتوي الإجابات على الأقل على إجابة صحيحة واحدة"
      );
    }

    let image;
    if (file) {
      image = file.path;
    }

    let totalMarkShare;
    if (group.mainTitle === null) {
      totalMarkShare = group.totalMark;
    } else {
      totalMarkShare = questionData.mark;
    }

    const question = await Question.create({
      ...questionData,
      image,
      mark: totalMarkShare,
    });
    await question.populate("groupId", "mainTitle");

    if (!question) throw new NotFoundError("فشل إنشاء السؤال");

    return { id: question.id, message: "تم إنشاء السؤال بنجاح" };
  }

  // Get question by ID
  static async getQuestionById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    const question = await Question.findById(id).populate(
      "groupId",
      "mainTitle totalMark"
    );
    if (!question) throw new NotFoundError("السؤال غير موجود");

    return question;
  }

  // Get questions by group ID
  static async getQuestionsByGroupId(groupId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    const allQuestions = await Question.find({ groupId });

    const limit: number = allQuestions.length;

    const shuffledQuestions = this.shuffleArray([...allQuestions]);

    return limit ? shuffledQuestions.slice(0, limit) : shuffledQuestions;
  }

  // Update question
  static async updateQuestion(id: string, questionData: Partial<IQuestion>) {
    const { error } = validateUpdateQuestion(questionData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    if (
      questionData.groupId &&
      !mongoose.Types.ObjectId.isValid(
        questionData.groupId as unknown as string
      )
    ) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    if (questionData.groupId) {
      const groupHave = await Group.findById(questionData.groupId);
      if (!groupHave) throw new NotFoundError("المجموعة غير موجودة");
    }

    // Validate that at least one answer is correct if answers are being updated
    if (questionData.answers && questionData.answers.length > 0) {
      const hasCorrectAnswer = questionData.answers.some(
        (answer) => answer.correct
      );
      if (!hasCorrectAnswer) {
        throw new BadRequestError(
          "يجب أن تحتوي الإجابات على الأقل على إجابة صحيحة واحدة"
        );
      }
    }

    const questionHave = await Question.findById(id);
    if (!questionHave) throw new NotFoundError("السؤال غير موجود");

    const updatedQuestion = await Question.findByIdAndUpdate(id, questionData, {
      new: true,
      runValidators: true,
    });

    if (!updatedQuestion) throw new NotFoundError("فشل تحديث السؤال");

    return { message: "تم تحديث السؤال بنجاح" };
  }

  // Update question image
  static async updateQuestionImage(id: string, file: ICloudinaryFile) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    if (!file) throw new BadRequestError("صورة السؤال مطلوبة");

    const questionHave = await Question.findById(id);
    if (!questionHave) throw new NotFoundError("السؤال غير موجود");

    const question = await Question.findByIdAndUpdate(
      id,
      { image: file.path },
      { new: true, runValidators: true }
    );

    if (!question) throw new NotFoundError("فشل تحديث صورة السؤال");

    return { message: "تم تحديث صورة السؤال بنجاح" };
  }

  // Delete question
  static async deleteQuestion(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    const question = await Question.findByIdAndDelete(id);
    if (!question) throw new NotFoundError("السؤال غير موجود");
    return { message: "تم حذف السؤال بنجاح" };
  }

  // Delete questions by group id
  static async deleteQuestionsByGroupId(groupId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    const result = await Question.deleteMany({ groupId });

    return {
      message: "تم حذف جميع أسئلة المجموعة بنجاح",
      deletedCount: result.deletedCount,
    };
  }

  // Delete question image
  static async deleteQuestionImage(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    const question = await Question.findById(id);
    if (!question) {
      throw new NotFoundError("السؤال غير موجود");
    }

    const questionDeleteImage = await Question.findByIdAndUpdate(
      id,
      { image: "" },
      { new: true, runValidators: true }
    );

    if (!questionDeleteImage) {
      throw new NotFoundError("فشل حذف صورة السؤال بنجاح");
    }

    return {
      message: "تم حذف صورة السؤال بنجاح",
    };
  }

  // Shuffle Array => for make change in question order
  private static shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export { QuestionService };
