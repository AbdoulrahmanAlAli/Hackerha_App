import express from "express";
import { notFoundMiddleware } from "./core/middlewares/notFound.middleware";
import { errorMiddleware } from "./core/middlewares/error.middleware";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
