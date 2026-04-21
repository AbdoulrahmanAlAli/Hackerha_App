import { Course } from "../../course/models/course.model";

export class BotCourseService {
  static async getCoursesForTelegram(filters: {
    universityBranch: "دمشق" | "حلب";
    year: string;
    semester: string;
  }) {
    const courses = await Course.find({
      universityBranch: filters.universityBranch,
      year: filters.year,
      semester: filters.semester,
      available: true,
      maintenance: false,
    })
      .sort({ createdAt: -1 })
      .select("-__v -whatsapp -students")
      .populate("teachers", "fullName name")
      .lean();

    return courses.map((c: any) => {
      const discountedPrice =
        c.discount?.dis && c.discount?.rate
          ? c.price * (1 - c.discount.rate / 100)
          : c.price;

      const finalPrice = c.free ? 0 : discountedPrice;

      return {
        _id: c._id.toString(),
        name: c.name,
        price: c.price,
        discountedPrice: finalPrice,
        isDiscounted: c.discount?.dis || false,
        discount: c.discount,
        teachers: c.teachers || [],
        free: c.free,
        available: c.available,
        maintenance: c.maintenance,
      };
    });
  }

  static async getCourseById(courseId: string) {
    const course = await Course.findById(courseId)
      .populate("teachers", "fullName name")
      .lean();

    if (!course) return null;

    const discountedPrice =
      course.discount?.dis && course.discount?.rate
        ? course.price * (1 - course.discount.rate / 100)
        : course.price;

    const finalPrice = course.free ? 0 : discountedPrice;

    return {
      ...course,
      _id: course._id.toString(),
      discountedPrice: finalPrice,
      isDiscounted: course.discount?.dis || false,
    };
  }

  static formatCourseCard(course: any) {
    const teachersText =
      course.teachers?.length > 0
        ? course.teachers
            .map((t: any) => t.fullName || t.name || "أستاذ")
            .join(" • ")
        : "غير محدد";

    const hasDiscount = course.discount?.dis && course.discount?.rate > 0;

    const lines = [
      `📘 ${course.name}`,
      `👨‍🏫 الأساتذة: ${teachersText}`,
      `💵 السعر الأساسي: ${course.price}`,
      hasDiscount ? `🔥 الخصم: ${course.discount.rate}%` : `🔥 الخصم: لا يوجد`,
      `✅ السعر النهائي: ${course.discountedPrice}`,
      course.free || course.discountedPrice === 0 ? `🎁 هذا الكورس مجاني` : `💳 هذا الكورس مدفوع`,
    ];

    return lines.join("\n");
  }
}