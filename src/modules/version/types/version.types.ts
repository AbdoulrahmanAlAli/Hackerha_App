import mongoose from "mongoose";

export interface VersionDocument extends mongoose.Document {
  version: string;
  url: string;
}