import { telegramBot } from "../bot";

export async function launchTelegramBot() {
  await telegramBot.telegram.setMyCommands([
    { command: "start", description: "بدء استخدام البوت" },
    { command: "support", description: "الدعم الفني" },
    { command: "social", description: "روابط التواصل والتطبيق" },
    { command: "cancel", description: "إلغاء العملية الحالية" },
  ]);

  await telegramBot.launch();

  process.once("SIGINT", () => telegramBot.stop("SIGINT"));
  process.once("SIGTERM", () => telegramBot.stop("SIGTERM"));

  console.log("Telegram bot is running...");
}