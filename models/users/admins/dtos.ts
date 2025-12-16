import { Document } from "mongoose";

export interface IAdmin extends Document {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
}
