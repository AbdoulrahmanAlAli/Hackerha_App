import {
  BadRequestError,
  NotFoundError,
} from "../../../middlewares/handleErrors";
import {
  Content,
  validateCreateContent,
  validateUpdateContent,
} from "../../../models/banks/content/Content.model";
import { IContent } from "../../../models/banks/content/dtos";
import { Student } from "../../../models/users/students/Student.model";

class CtrlContentService {
  // ~ Get => /api/hackit/ctrl/content ~ Get All Content
  static async getAllContents() {
    const contents = await Content.find().sort({ createdAt: -1 });
    return contents;
  }

  // ~ Get => /api/hackit/ctrl/content/:id ~ Get Single Content
  static async getSingleContent(id: string) {
    const content = await Content.findById(id);
    if (!content) {
      throw new NotFoundError("المحتوى غير موجود");
    }
    return content;
  }

  // ~ Get => /api/hackit/ctrl/content/bank/:bankId ~ Get Content by Bank ID
  static async getContentByBankId(bankId: string) {
    const contents = await Content.find({ bank: bankId }).sort({
      createdAt: -1,
    });

    if (!contents || contents.length === 0) {
      throw new NotFoundError("لم يتم العثور على محتوى لهذا البنك");
    }

    return contents;
  }

  // ~ Post => /api/hackit/ctrl/content ~ Create New Content
  static async createNewContent(contentData: IContent) {
    const { error } = validateCreateContent(contentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const newContent = await Content.create(contentData);
    if (!newContent) throw new NotFoundError("فشل إنشاء المحتوى");
    return { id: newContent.id, message: "تم إنشاء المحتوى بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/content/:id ~ Update Content
  static async updateContent(contentData: Partial<IContent>, id: string) {
    const { error } = validateUpdateContent(contentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const contentHave = await Content.findById(id);
    if (!contentHave) {
      throw new BadRequestError("المحتوى غير موجود");
    }

    const updatedContent = await Content.findByIdAndUpdate(id, contentData, {
      new: true,
      runValidators: true,
    }).populate("bank");

    if (!updatedContent) {
      throw new NotFoundError("فشل في تحديث المحتوى");
    }

    return { message: "تم تحديث المحتوى بنجاح" };
  }

  // ~ Delete => /api/hackit/ctrl/content/:id ~ Delete Content
  static async deleteContent(id: string) {
    const deletedContent = await Content.findByIdAndDelete(id);
    if (!deletedContent) {
      throw new NotFoundError("المحتوى غير موجود");
    }
    return { message: "تم حذف المحتوى بنجاح" };
  }
}

export { CtrlContentService };
