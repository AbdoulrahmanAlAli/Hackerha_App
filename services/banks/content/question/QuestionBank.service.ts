import mongoose from "mongoose";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../middlewares/handleErrors";
import { GroupBank } from "../../../../models/banks/content/group/GroupBank.model";
import { IQuestionBank } from "../../../../models/banks/content/question/dtos";
import {
  QuestionBank,
  validateCreateQuestionBank,
  validateUpdateQuestionBank,
} from "../../../../models/banks/content/question/QuestionBank.model";
import { ICloudinaryFile } from "../../../../utils/types";

class QuestionBankService {
  // Create new question bank
  static async createQuestionBank(
    questionData: IQuestionBank,
    file?: ICloudinaryFile
  ) {
    const { error } = validateCreateQuestionBank(questionData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (
      !mongoose.Types.ObjectId.isValid(
        questionData.groupBankId as unknown as string
      )
    ) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    // Verify group exists
    const group = await GroupBank.findById(questionData.groupBankId);
    if (!group) throw new NotFoundError("المجموعة غير موجودة");

    if (group.mainTitle === null) {
      const existingQuestions = await QuestionBank.find({
        groupBankId: questionData.groupBankId,
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

    const questionBank = await QuestionBank.create({
      ...questionData,
      image,
    });
    await questionBank.populate("groupBankId", "mainTitle");

    if (!questionBank) throw new NotFoundError("فشل إنشاء السؤال");

    return { id: questionBank.id, message: "تم إنشاء السؤال بنجاح" };
  }

  // Get question Bank by ID
  static async getQuestionBankById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    const questionBank = await QuestionBank.findById(id).populate(
      "groupBankId",
      "mainTitle totalMark"
    );
    if (!questionBank) throw new NotFoundError("السؤال غير موجود");

    return questionBank;
  }

  // Get questions Bank by group ID
  static async getQuestionsBankByGroupId(groupBankId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupBankId)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    const allQuestionsBank = await QuestionBank.find({ groupBankId });

    const limit: number = allQuestionsBank.length;

    const shuffledQuestionsBank = this.shuffleArray([...allQuestionsBank]);

    return limit
      ? shuffledQuestionsBank.slice(0, limit)
      : shuffledQuestionsBank;
  }

  // Update question Bank
  static async updateQuestionBank(
    id: string,
    questionData: Partial<IQuestionBank>
  ) {
    const { error } = validateUpdateQuestionBank(questionData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    if (
      questionData.groupBankId &&
      !mongoose.Types.ObjectId.isValid(
        questionData.groupBankId as unknown as string
      )
    ) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    if (questionData.groupBankId) {
      const groupHave = await GroupBank.findById(questionData.groupBankId);
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

    const questionBankHave = await QuestionBank.findById(id);
    if (!questionBankHave) throw new NotFoundError("السؤال غير موجود");

    const updatedQuestionBank = await QuestionBank.findByIdAndUpdate(
      id,
      questionData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedQuestionBank) throw new NotFoundError("فشل تحديث السؤال");

    return { message: "تم تحديث السؤال بنجاح" };
  }

  // Update question Bank image
  static async updateQuestionBankImage(id: string, file: ICloudinaryFile) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    if (!file) throw new BadRequestError("صورة السؤال مطلوبة");

    const questionBankHave = await QuestionBank.findById(id);
    if (!questionBankHave) throw new NotFoundError("السؤال غير موجود");

    const questionBank = await QuestionBank.findByIdAndUpdate(
      id,
      { image: file.path },
      { new: true, runValidators: true }
    );

    if (!questionBank) throw new NotFoundError("فشل تحديث صورة السؤال");

    return { message: "تم تحديث صورة السؤال بنجاح" };
  }

  // Delete question Bank
  static async deleteQuestionBank(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    const questionBank = await QuestionBank.findByIdAndDelete(id);
    if (!questionBank) throw new NotFoundError("السؤال غير موجود");
    return { message: "تم حذف السؤال بنجاح" };
  }

  // Delete questions Bank by group id
  static async deleteQuestionsBankByGroupId(groupBankId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupBankId)) {
      throw new BadRequestError("معرف المجموعة غير صالح");
    }

    const result = await QuestionBank.deleteMany({ groupBankId });

    return {
      message: "تم حذف جميع أسئلة المجموعة بنجاح",
      deletedCount: result.deletedCount,
    };
  }

  // Delete question bank image
  static async deleteQuestionBankImage(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف السؤال غير صالح");
    }

    const questionBank = await QuestionBank.findById(id);
    if (!questionBank) {
      throw new NotFoundError("السؤال غير موجود");
    }

    const questionBankDeleteImage = await QuestionBank.findByIdAndUpdate(
      id,
      { image: "" },
      { new: true, runValidators: true }
    );

    if (!questionBankDeleteImage) {
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

export { QuestionBankService };
