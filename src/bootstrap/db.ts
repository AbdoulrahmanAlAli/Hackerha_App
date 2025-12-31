import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  logger.info("MongoDB connected");
}
