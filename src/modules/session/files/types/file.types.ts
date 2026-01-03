import { Document, Types } from "mongoose";

export type FileType = "pdf";

export interface IFile extends Document {
  url: string;
  name: string;
  type: FileType; // pdf فقط
  courseId: Types.ObjectId;
  sessionId: Types.ObjectId;
  description?: string;
}

export type CreateFileInput = {
  url: string;
  name: string;
  courseId: string;
  sessionId: string;
  description?: string;
};

export type UpdateFileInput = {
  name?: string;
  description?: string;
};