import { env } from "./bootstrap/env";
import { connectDB } from "./bootstrap/db";
import { createApp } from "./app";
import { logger } from "./bootstrap/logger";

async function bootstrap() {
  await connectDB();
  const app = createApp();
  app.listen(env.PORT, () => logger.info(`Server running on :${env.PORT}`));
}

bootstrap().catch((e) => {
  logger.error("Failed to start", e);
  process.exit(1);
});
