import { Telegraf, Scenes, session } from "telegraf";
import { MyContext } from "./bot.session";
import { enrollCourseScene } from "./scenes/enrollCourse.scene";
import { BOT_SCENES } from "./bot.constants";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

export const telegramBot = new Telegraf<MyContext>(TELEGRAM_BOT_TOKEN);

telegramBot.command("support", async (ctx) => {
  await ctx.reply(
    [
      "🛟 الدعم الفني",
      "",
      "WhatsApp: 0985069024",
    ].join("\n"),
  );
});

telegramBot.command("social", async (ctx) => {
  await ctx.reply(
    [
      "🌐 روابط هكرها",
      "",
      "Instagram: hackerha_app",
      "Telegram: t.me/hackerha_app",
      "Download App: https://t.me/hackerha_app/14",
    ].join("\n"),
  );
});

const stage = new Scenes.Stage<MyContext>([enrollCourseScene]);

telegramBot.use(session());
telegramBot.use(stage.middleware());

telegramBot.start(async (ctx) => {
  await ctx.scene.enter(BOT_SCENES.ENROLL_COURSE);
});

telegramBot.command("cancel", async (ctx) => {
  await ctx.reply("تم إلغاء العملية.");
  await ctx.scene.leave();
});

telegramBot.catch((err, ctx) => {
  console.error("Telegram bot error:", err);
  ctx.reply("حدث خطأ غير متوقع في البوت.");
});

export async function launchTelegramBot() {
  await telegramBot.telegram.setMyCommands([
  { command: "start", description: "بدء استخدام البوت" },
  { command: "support", description: "الدعم الفني" },
  { command: "social", description: "روابط التواصل" },
  { command: "cancel", description: "إلغاء العملية" },
  ]);

  await telegramBot.launch();
  process.once("SIGINT", () => telegramBot.stop("SIGINT"));
  process.once("SIGTERM", () => telegramBot.stop("SIGTERM"));
  console.log("Telegram bot is running...");
}