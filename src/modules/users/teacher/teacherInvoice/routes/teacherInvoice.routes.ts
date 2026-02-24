import { Router } from "express";
import verifyToken from "../../../../../core/middlewares/verifyToken";
import checkRole from "../../../../../core/middlewares/checkRole";
import { ctrlTeacherInvoiceController } from "../controllers/teacherInvoice.controller";
import { requireAdmin } from "../../../../../core/middlewares/requireRole.middleware";

const router: Router = Router();

// POST /api/hackit/ctrl/teacher/invoice
router.post(
  "/",
  verifyToken,
  requireAdmin,
  ctrlTeacherInvoiceController.createInvoice,
);

// PUT /api/hackit/ctrl/teacher/invoice/:id
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  ctrlTeacherInvoiceController.updateInvoice,
);

// DELETE /api/hackit/ctrl/teacher/invoice/:id
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  ctrlTeacherInvoiceController.deleteInvoice,
);

// GET /api/hackit/ctrl/teacher/invoice/:id
router.get(
  "/:id",
  verifyToken,
  checkRole(["admin", "teacher"]),
  ctrlTeacherInvoiceController.getTeacherInvoices,
);

export default router;
