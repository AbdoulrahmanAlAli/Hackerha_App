import { Document, Types } from "mongoose";

export interface IGroup extends Document {
  examId: Types.ObjectId;
  mainTitle?: string | null;
  totalMark?: number | null;
}
