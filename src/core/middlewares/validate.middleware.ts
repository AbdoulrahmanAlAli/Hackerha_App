import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

type Target = "body" | "query" | "params";

export function validate(
  schema: ZodSchema,
  target: Target = "body"
): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.parse(req[target]);
    (req as any)[target] = parsed;
    next();
  };
}
