import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

export async function connectDB(): Promise<void> {
  if (!env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  mongoose.set("strictQuery", true);

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(env.MONGO_URI);
      logger.success("MongoDB connected");
      return;
    } catch (error) {
      retries++;
      logger.error(`MongoDB connection failed (attempt ${retries})`, error);

      if (retries === MAX_RETRIES) {
        process.exit(1);
      }

      await new Promise((res) => setTimeout(res, RETRY_DELAY));
    }
  }
}