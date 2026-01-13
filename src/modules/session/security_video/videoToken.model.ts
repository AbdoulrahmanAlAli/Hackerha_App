import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// Video Token Schema
const VideoTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true }, // hex(64)
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },

    libraryId: { type: String, required: true },
    videoId: { type: String, required: true },

    used: { type: Boolean, default: false, index: true },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL
    },
  },
  { timestamps: true }
);

// Indexes
VideoTokenSchema.index({ sessionId: 1, userId: 1, used: 1 });

// Video Token Model
export type VideoTokenDocument = InferSchemaType<typeof VideoTokenSchema>;
export const VideoToken: Model<VideoTokenDocument> =
  mongoose.models.VideoToken || mongoose.model("VideoToken", VideoTokenSchema);
