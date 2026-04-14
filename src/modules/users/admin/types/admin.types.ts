import type { HydratedDocument, Types } from "mongoose";

export type AdminRole = "admin" | "dataEntry" | "superAdmin";

export interface IAdmin {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: AdminRole;
}

export type AdminDocument = HydratedDocument<IAdmin> & {
  _id: Types.ObjectId;
};