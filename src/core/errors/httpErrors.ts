import { AppError } from "./AppError";

export const badRequest = (m = "Bad request") => new AppError(m, 400);
export const unauthorized = (m = "Unauthorized") => new AppError(m, 401);
export const forbidden = (m = "Forbidden") => new AppError(m, 403);
export const notFound = (m = "Not found") => new AppError(m, 404);