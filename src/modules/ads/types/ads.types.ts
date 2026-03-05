import mongoose, { Document } from "mongoose";

export interface IAds {
  image: string;
}

export interface IAdsMethods {}

export interface AdsDocument extends IAds, IAdsMethods, Document {}

// Create input type
export type CreateAdsInput = {
  image: string;
};

// Update input type
export type UpdateAdsInput = Partial<CreateAdsInput>;
