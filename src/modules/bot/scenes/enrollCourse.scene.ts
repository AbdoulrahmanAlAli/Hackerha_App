import fs from "fs";
import path from "path";
import { Scenes } from "telegraf";
import { env } from "../../../bootstrap/env";
import { MyContext, BotStep } from "../bot.session";
import {
  ACADEMIC_YEARS,
  BOT_ACTIONS,
  BOT_SCENES,
  SEMESTERS,
  UNIVERSITY_BRANCHES,
} from "../bot.constants";
import {
  afterCourseSelectedKeyboard,
  afterResultKeyboard,
  branchInlineKeyboard,
  coursesInlineKeyboard,
  errorKeyboard,
  mainMenuKeyboard,
  noCoursesKeyboard,
  semesterInlineKeyboard,
  yearInlineKeyboard,
} from "../utils/bot-keyboards";
import { BotCourseService } from "../services/bot-course.service";
import { BotPaymentService } from "../services/bot-payment.service";
import { EnrollWizardSession } from "../bot.types";

const QR_PATH = env.TELEGRAM_PAYMENT_QR_PATH
  ? path.resolve(env.TELEGRAM_PAYMENT_QR_PATH)
  : null;

function getStep(ctx: MyContext): BotStep {
  return ctx.scene.session.currentStep || "idle";
}

function setStep(ctx: MyContext, step: BotStep) {
  ctx.scene.session.currentStep = step;
}

function resetSession(ctx: MyContext) {
  ctx.scene.session.enroll = {};
  ctx.scene.session.currentStep = "idle";
}

function hasQRFile() {
  return !!QR_PATH && fs.existsSync(QR_PATH);
}

async function showHome(ctx: MyContext) {
  resetSession(ctx);
  await ctx.reply(
    "✨ أهلاً بك في بوت الكورسات\n\nيمكنك تصفح الكورسات واستخراج كود الدفع بسهولة.",
    mainMenuKeyboard(),
  );
}

async function showBranches(ctx: MyContext) {
  setStep(ctx, "branch");
  await ctx.reply("🏫 اختر الفرع الجامعي:", branchInlineKeyboard());
}

async function showYears(ctx: MyContext) {
  setStep(ctx, "year");
  await ctx.reply("📚 اختر السنة الدراسية:", yearInlineKeyboard());
}

async function showSemesters(ctx: MyContext) {
  setStep(ctx, "semester");
  await ctx.reply("🗓️ اختر الفصل الدراسي:", semesterInlineKeyboard());
}

async function showCourses(ctx: MyContext) {
  const { universityBranch, year, semester } = ctx.scene.session.enroll || {};

  if (!universityBranch || !year || !semester) {
    await ctx.reply("تعذر تحميل الكورسات. ابدأ من جديد.", errorKeyboard());
    return showHome(ctx);
  }

  const courses = await BotCourseService.getCoursesForTelegram({
    universityBranch,
    year,
    semester,
  });

  setStep(ctx, "course");

  if (!courses.length) {
    await ctx.reply(
      "📭 لا توجد كورسات متاحة حاليًا لهذه التصفية.",
      noCoursesKeyboard(),
    );
    return;
  }

  await ctx.reply(
    `📦 الكورسات المتاحة\n🏫 ${universityBranch}\n📚 ${year}\n🗓️ ${semester}`,
  );

  for (const course of courses) {
    await ctx.reply(
      BotCourseService.formatCourseCard(course),
      coursesInlineKeyboard([{ _id: course._id, name: course.name }]),
    );
  }
}

async function askUniversityNumber(ctx: MyContext) {
  setStep(ctx, "university_number");
  await ctx.reply(
    "🆔 أرسل الآن الرقم الجامعي.",
    afterCourseSelectedKeyboard(),
  );
}

export const enrollCourseScene = new Scenes.BaseScene<MyContext>(
  BOT_SCENES.ENROLL_COURSE,
);

enrollCourseScene.enter(async (ctx) => {
  await showHome(ctx);
});

enrollCourseScene.command("start", async (ctx) => {
  await showHome(ctx);
});

enrollCourseScene.command("cancel", async (ctx) => {
  resetSession(ctx);
  await ctx.reply("تم إلغاء العملية.", mainMenuKeyboard());
});

enrollCourseScene.on("callback_query", async (ctx) => {
  if (!("data" in ctx.callbackQuery)) return;

  const data = ctx.callbackQuery.data;

  try {
    if (data === BOT_ACTIONS.HOME || data === BOT_ACTIONS.RESTART) {
      await ctx.answerCbQuery();
      return showHome(ctx);
    }

    if (data === BOT_ACTIONS.START) {
      await ctx.answerCbQuery();
      return showBranches(ctx);
    }

    if (data === BOT_ACTIONS.CANCEL) {
      await ctx.answerCbQuery("تم الإلغاء");
      resetSession(ctx);
      await ctx.reply("تم إلغاء العملية.", mainMenuKeyboard());
      return;
    }

    if (data === BOT_ACTIONS.BACK_TO_BRANCH) {
      await ctx.answerCbQuery();
      return showBranches(ctx);
    }

    if (data === BOT_ACTIONS.BACK_TO_YEAR) {
      await ctx.answerCbQuery();
      return showYears(ctx);
    }

    if (data === BOT_ACTIONS.BACK_TO_SEMESTER) {
      await ctx.answerCbQuery();
      return showSemesters(ctx);
    }

    if (data === BOT_ACTIONS.BACK_TO_COURSES) {
      await ctx.answerCbQuery();
      return showCourses(ctx);
    }

    if (data.startsWith("branch:")) {
      const branch = data.replace("branch:", "");

      if (!UNIVERSITY_BRANCHES.includes(branch as (typeof UNIVERSITY_BRANCHES)[number])) {
        await ctx.answerCbQuery("فرع غير صالح");
        return;
      }

      ctx.scene.session.enroll = {
        ...ctx.scene.session.enroll,
        universityBranch: branch as "دمشق" | "حلب",
      };

      await ctx.answerCbQuery();
      return showYears(ctx);
    }

    if (data.startsWith("year:")) {
      const year = data.replace("year:", "");

      if (!ACADEMIC_YEARS.includes(year as (typeof ACADEMIC_YEARS)[number])) {
        await ctx.answerCbQuery("سنة غير صالحة");
        return;
      }

      ctx.scene.session.enroll = {
        ...ctx.scene.session.enroll,
        year: year as EnrollWizardSession["year"],
      };

      await ctx.answerCbQuery();
      return showSemesters(ctx);
    }

    if (data.startsWith("semester:")) {
      const semester = data.replace("semester:", "");

      if (!SEMESTERS.includes(semester as (typeof SEMESTERS)[number])) {
        await ctx.answerCbQuery("فصل غير صالح");
        return;
      }

      ctx.scene.session.enroll = {
        ...ctx.scene.session.enroll,
        semester: semester as EnrollWizardSession["semester"],
      };

      await ctx.answerCbQuery();
      return showCourses(ctx);
    }

    if (data.startsWith("select_course:")) {
      const courseId = data.replace("select_course:", "");
      const course = await BotCourseService.getCourseById(courseId);

      if (!course) {
        await ctx.answerCbQuery("الكورس غير موجود");
        await ctx.reply("الكورس لم يعد متاحًا.", errorKeyboard());
        return;
      }

      if (!course.available || course.maintenance) {
        await ctx.answerCbQuery("هذا الكورس غير متاح");
        await ctx.reply("هذا الكورس غير متاح حاليًا.", errorKeyboard());
        return;
      }

      ctx.scene.session.enroll = {
        ...ctx.scene.session.enroll,
        selectedCourseId: courseId,
        selectedCourseName: course.name,
        selectedCourseFinalPrice: course.discountedPrice,
      };

      await ctx.answerCbQuery("تم اختيار الكورس");
      await ctx.reply(`✅ تم اختيار الكورس:\n📘 ${course.name}`);

      return askUniversityNumber(ctx);
    }

    await ctx.answerCbQuery("هذا الزر لم يعد صالحًا");
  } catch (error: any) {
    await ctx.answerCbQuery("حدث خطأ");
    await ctx.reply(
      error?.message || "حدث خطأ غير متوقع.",
      errorKeyboard(),
    );
  }
});

enrollCourseScene.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (text === "/start") {
    return showHome(ctx);
  }

  if (text === "/cancel") {
    resetSession(ctx);
    await ctx.reply("تم إلغاء العملية.", mainMenuKeyboard());
    return;
  }

  const step = getStep(ctx);

  if (step !== "university_number") {
    await ctx.reply(
      "استخدم الأزرار الظاهرة أو أرسل /start للبدء من جديد.",
      mainMenuKeyboard(),
    );
    return;
  }

  const courseId = ctx.scene.session.enroll?.selectedCourseId;

  if (!courseId) {
    await ctx.reply("لم يتم اختيار كورس بعد.", errorKeyboard());
    return showHome(ctx);
  }

  try {
    const result = await BotPaymentService.generateCodeForTelegram({
      courseId,
      universityNumber: text,
    });

    if (result.isFree) {
      await ctx.reply(
        [
          `🎉 الكورس مجاني أو سعره النهائي صفر`,
          `📘 الكورس: ${result.courseName}`,
          `🔐 كود التفعيل: ${result.code}`,
          `⏳ صالح حتى: ${new Date(result.expiresAt).toLocaleString("ar-SY")}`,
        ].join("\n"),
        afterResultKeyboard(),
      );
    } else {
      const caption = [
        `💳 تم إنشاء كود الدفع بنجاح`,
        `📘 الكورس: ${result.courseName}`,
        `💵 السعر النهائي: ${result.finalPrice}`,
        `🔐 كود الدفع: ${result.code}`,
        `⏳ صالح حتى: ${new Date(result.expiresAt).toLocaleString("ar-SY")}`,
        ``,
        `يرجى إتمام الدفع عبر رمز QR المرفق والاحتفاظ بالكود.`,
      ].join("\n");

      if (hasQRFile() && QR_PATH) {
        await ctx.replyWithPhoto(
          { source: fs.createReadStream(QR_PATH) },
          { caption, ...afterResultKeyboard() },
        );
      } else {
        await ctx.reply(caption, afterResultKeyboard());
      }
    }

    resetSession(ctx);
  } catch (error: any) {
    await ctx.reply(
      error?.message || "حدث خطأ أثناء إنشاء كود الدفع.",
      errorKeyboard(),
    );
  }
});