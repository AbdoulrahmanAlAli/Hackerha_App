import type { HydratedDocument, Types } from "mongoose";

export interface IAdmin {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export type AdminDocument = HydratedDocument<IAdmin> & {
  _id: Types.ObjectId;
};