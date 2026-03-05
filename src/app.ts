import express from "express";
import { notFoundMiddleware } from "./core/middlewares/notFound.middleware";
import { errorMiddleware } from "./core/middlewares/error.middleware";

import { performanceMiddleware } from "./core/middlewares/performance.middleware";

// Admin Api
import adminAuthRoutes from "./modules/users/admin/routes/admin.auth.routes";
import adminRoutes from "./modules/users/admin/routes/admin.routes";

// Student Api
import studentAuthRoutes from "./modules/users/student/routes/student.auth.routes";
import studentRoutes from "./modules/users/student/routes/student.routes";

// Teacher Api
import teacherAuthRoutes from "./modules/users/teacher/routes/teacher.auth.routes";
import teacherRoutes from "./modules/users/teacher/routes/teacher.routes";

// Teacher Invoice
import teacherInvoiceRoutes from "./modules/users/teacher/teacherInvoice/routes/teacherInvoice.routes";

// ============= Coures App =============

// Course Api
import courseRoutes from "./modules/course/routes/course.routes";

// Session Api
import sessionRoutes from "./modules/session/routes/session.routes";

// Session Api // Security Video
import routeVideo from "./modules/session/security_video/token.routes";

// Files Api
import routeFiles from "./modules/session/files/routes/file.routes";

// Exam Api
import routeExam from "./modules/exam/routes/exam.routes";

// Group Api
import routeGroup from "./modules/exam/group/routes/group.routes";

// Question Api
import routeQuestion from "./modules/exam/question/routes/question.routes";

// Reorder Api
import reorderRouter from "./shared/reorder/routes/reorder.routes";

// ============= Notification =============

// Notification Api
import routeNotification from "./modules/notification/routes/notification.routes";

// ============= Version =============

// Version Api
import routeVersion from "./modules/version/routes/version.routes";

// ============= Payment =============

import routePayment from "./modules/payment/routes/payment.routes";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Performance
  app.use(performanceMiddleware);

  // Admin routes
  app.use("/api/hackit/ctrl/admin", adminAuthRoutes);
  app.use("/api/hackit/ctrl/admin", adminRoutes);

  // Student routes
  app.use("/api/hackit/ctrl/student", studentAuthRoutes);
  app.use("/api/hackit/ctrl/student", studentRoutes);

  // Teacher routes
  app.use("/api/hackit/ctrl/teacher", teacherAuthRoutes);
  app.use("/api/hackit/ctrl/teacher", teacherRoutes);

  // Teacher Invoice
  app.use("/api/hackit/ctrl/teacher/Invoice", teacherInvoiceRoutes);

  // ============= Coures App =============

  // Course routes
  app.use("/api/hackit/ctrl/course", courseRoutes);

  // Session routes
  app.use("/api/hackit/ctrl/session", sessionRoutes);

  // Sessoin routes // Security Video
  app.use("/api/video", routeVideo);

  // Files routes
  app.use("/api/hackit/ctrl/file", routeFiles);

  // Exam routes
  app.use("/api/hackit/ctrl/exam", routeExam);

  // Group routes
  app.use("/api/hackit/ctrl/groupExam", routeGroup);

  // Question routes
  app.use("/api/hackit/ctrl/questionExam", routeQuestion);

  // Reorder routes
  app.use("/api/hackit/ctrl/reorder", reorderRouter);

  // ============= Notification =============

  // Notification routes
  app.use("/api/hackit/ctrl/notification", routeNotification);

  // ============= Version =============

  // Version routes
  app.use("/api/hackit/ctrl/version", routeVersion);

  // ============= Payment =============

  app.use("/api/hackit/ctrl/payment", routePayment);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
