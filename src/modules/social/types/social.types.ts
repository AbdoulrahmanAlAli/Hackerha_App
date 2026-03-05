import mongoose, { Document } from "mongoose";

export interface ISocial {
  title: string;
  link: string;
}

export interface ISocialMethods {}

export interface SocialDocument extends ISocial, ISocialMethods, Document {}

// Create input type
export type CreateSocialInput = {
  title: string;
  link: string;
};

// Update input type
export type UpdateSocialInput = Partial<CreateSocialInput>;
