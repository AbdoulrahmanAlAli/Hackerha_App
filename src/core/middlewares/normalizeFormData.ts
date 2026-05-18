import { Request, Response, NextFunction } from "express";

const toBool = (v: any) => {
  if (typeof v === "boolean") return v;
  if (typeof v !== "string") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
};

const toNum = (v: any) => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return v;
  if (v.trim() === "") return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
};

export const normalizeCourseFormData = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const b: any = req.body || {};

  // 1) دعم discount كـ JSON string
  if (typeof b.discount === "string") {
    try {
      b.discount = JSON.parse(b.discount);
    } catch {
      // نخليها مثل ما هي لو فشل
    }
  }

  // 2) دعم discount.dis / discount.rate القادمة كحقول منفصلة
  if (!b.discount || typeof b.discount !== "object") b.discount = {};

  if (b["discount.dis"] !== undefined) b.discount.dis = b["discount.dis"];
  if (b["discount.rate"] !== undefined) b.discount.rate = b["discount.rate"];

  // 3) تحويل أنواع أهم الحقول
  b.price = toNum(b.price);
  b.fakeCount = toNum(b.fakeCount);
  b.free = toBool(b.free);
  b.available = toBool(b.available);
  b.maintenance = toBool(b.maintenance);

  if (b.discount) {
    b.discount.dis = toBool(b.discount.dis);
    b.discount.rate = toNum(b.discount.rate);
  }

  req.body = b;
  next();
};

export const normalizeFormData = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const b: any = req.body || {};

  // JSON strings → object/array
  for (const key of Object.keys(b)) {
    if (typeof b[key] === "string") {
      const v = b[key].trim();
      if (
        (v.startsWith("{") && v.endsWith("}")) ||
        (v.startsWith("[") && v.endsWith("]"))
      ) {
        try {
          b[key] = JSON.parse(v);
        } catch {}
      }
    }
  }

  // تحويل القيم
  for (const key of Object.keys(b)) {
    b[key] = toBool(toNum(b[key]));
  }

  req.body = b;
  next();
};

export const normalizeTeacherFormData = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const b: any = req.body || {};

  b.percentage = toNum(b.percentage);


  req.body = b;
  next();
};

export const normalizeBankFormData = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const b: any = req.body || {};

  // تحويل أنواع أهم الحقول
  b.available = toBool(b.available);

  // تنظيف النصوص
  if (b.title) b.title = b.title.trim();
  if (b.image) b.image = b.image.trim();
  if (b.year) b.year = b.year.trim();
  if (b.semester) b.semester = b.semester.trim();

  req.body = b;
  next();
};

// ميدلوير لتطبيع بيانات امتحان البنك
export const normalizeBankExamFormData = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const b: any = req.body || {};

  // تحويل الأرقام
  b.number = toNum(b.number);
  b.totalMark = toNum(b.totalMark);
  
  // تحويل البولين
  b.available = toBool(b.available);
  
  // تنظيف النصوص
  if (b.title) b.title = b.title.trim();
  if (b.duration) b.duration = b.duration.trim();
  if (b.pdfUrl) b.pdfUrl = b.pdfUrl.trim();
  
  // تنظيف ObjectId (إزالة المسافات)
  if (b.bankId) b.bankId = b.bankId.trim();

  req.body = b;
  next();
};
