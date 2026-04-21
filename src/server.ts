import { env } from "./bootstrap/env";
import { connectDB } from "./bootstrap/db";
import { createApp } from "./app";
import { logger } from "./bootstrap/logger";
import { launchTelegramBot } from "./modules/bot/bot";

async function bootstrap() {
  try {
    await connectDB();

    const app = createApp();

    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok" });
    });

    app.listen(env.PORT, () => {
      logger.info(`Server running on :${env.PORT}`);
    });

    // 🚀 تشغيل البوت بدون ما يوقف السيرفر
    launchTelegramBot().catch((err) => {
      logger.error("Telegram bot failed to start", err);
    });

  } catch (e) {
    logger.error("Failed to start", e);
    process.exit(1);
  }
}

bootstrap();