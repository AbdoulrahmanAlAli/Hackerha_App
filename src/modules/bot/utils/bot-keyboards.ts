import { Markup } from "telegraf";
import {
  ACADEMIC_YEARS,
  BOT_ACTIONS,
  SEMESTERS,
  UNIVERSITY_BRANCHES,
} from "../bot.constants";

export const mainMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("🚀 عرض الكورسات", BOT_ACTIONS.START)],
  ]);

export const branchInlineKeyboard = () =>
  Markup.inlineKeyboard([
    ...UNIVERSITY_BRANCHES.map((branch) => [
      Markup.button.callback(branch, `branch:${branch}`),
    ]),
    [
      Markup.button.callback("🏠 القائمة الرئيسية", BOT_ACTIONS.HOME),
      Markup.button.callback("❌ إلغاء", BOT_ACTIONS.CANCEL),
    ],
  ]);

export const yearInlineKeyboard = () =>
  Markup.inlineKeyboard([
    ...ACADEMIC_YEARS.map((year) => [
      Markup.button.callback(year, `year:${year}`),
    ]),
    [
      Markup.button.callback("⬅️ رجوع", BOT_ACTIONS.BACK_TO_BRANCH),
      Markup.button.callback("🏠 الرئيسية", BOT_ACTIONS.HOME),
    ],
  ]);

export const semesterInlineKeyboard = () =>
  Markup.inlineKeyboard([
    ...SEMESTERS.map((semester) => [
      Markup.button.callback(semester, `semester:${semester}`),
    ]),
    [
      Markup.button.callback("⬅️ رجوع", BOT_ACTIONS.BACK_TO_YEAR),
      Markup.button.callback("🏠 الرئيسية", BOT_ACTIONS.HOME),
    ],
  ]);

export const coursesInlineKeyboard = (
  courses: { _id: string; name: string }[],
) =>
  Markup.inlineKeyboard([
    ...courses.map((course) => [
      Markup.button.callback(`📘 ${course.name}`, `select_course:${course._id}`),
    ]),
    [
      Markup.button.callback("⬅️ رجوع", BOT_ACTIONS.BACK_TO_SEMESTER),
      Markup.button.callback("🏠 الرئيسية", BOT_ACTIONS.HOME),
    ],
  ]);

export const noCoursesKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback("⬅️ رجوع", BOT_ACTIONS.BACK_TO_SEMESTER),
      Markup.button.callback("🔄 إعادة البدء", BOT_ACTIONS.RESTART),
    ],
    [Markup.button.callback("🏠 الرئيسية", BOT_ACTIONS.HOME)],
  ]);

export const afterCourseSelectedKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback("⬅️ رجوع للكورسات", BOT_ACTIONS.BACK_TO_COURSES),
      Markup.button.callback("🏠 الرئيسية", BOT_ACTIONS.HOME),
    ],
    [Markup.button.callback("❌ إلغاء", BOT_ACTIONS.CANCEL)],
  ]);

export const afterResultKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback("🔄 بدء جديد", BOT_ACTIONS.RESTART),
      Markup.button.callback("🏠 الرئيسية", BOT_ACTIONS.HOME),
    ],
  ]);

export const errorKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback("🔄 إعادة المحاولة", BOT_ACTIONS.RESTART),
      Markup.button.callback("🏠 الرئيسية", BOT_ACTIONS.HOME),
    ],
  ]);