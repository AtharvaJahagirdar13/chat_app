import mongoose from "mongoose";
import { canonicalDirectKey } from "../lib/conversation.js";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct"],
      default: "direct",
      required: true,
    },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
      required: true,
      validate: {
        validator(participants) {
          return (
            participants.length === 2 &&
            participants[0].toString() !== participants[1].toString()
          );
        },
        message: "Direct conversations require exactly two distinct participants",
      },
    },
    directKey: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

conversationSchema.pre("validate", function enforceCanonicalDirectKey() {
  if (this.type === "direct" && this.participants?.length === 2) {
    this.directKey = canonicalDirectKey(this.participants[0], this.participants[1]);
  }
});

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
