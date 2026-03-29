import { Types } from "mongoose";

export type TextDirection = "ltr" | "rtl";

export interface IAnswer {
  title: string;
  correct: boolean;
}

export interface ISingleQuestion {
  examId: Types.ObjectId;
  title?: string;
  subTitle?: string;
  image?: string;
  answers: IAnswer[];
  mark: number;
  note?: string;
  direction: TextDirection;
}
