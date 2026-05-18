import { Types } from "mongoose";

export type TextDirection = "ltr" | "rtl";

export interface IAnswerBank {
  title: string;
  correct: boolean;
}

export interface ISingleQuestionBank {
  bankExamId: Types.ObjectId;
  number: number;
  title?: string;
  subTitle?: string;
  image?: string;
  answers: IAnswerBank[];
  mark: number;
  note?: string;
  direction: TextDirection;
}