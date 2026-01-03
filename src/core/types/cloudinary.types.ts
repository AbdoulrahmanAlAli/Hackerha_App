/**
 * رفع ملفات
 */
export interface ICloudinaryFile extends Express.Multer.File {
  path: string;
}
