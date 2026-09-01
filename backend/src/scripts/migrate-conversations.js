import { config } from "dotenv";
import mongoose from "mongoose";
import { planLegacyMessages } from "../lib/conversation-migration.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

config({ path: "./.env" });

const dryRun = process.argv.includes("--dry-run");

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);

  const messages = await Message.find({}).sort({ createdAt: 1, _id: 1 }).lean();
  const userIds = await User.find({}).distinct("_id");
  const existingConversations = await Conversation.find({ type: "direct" }).lean();
  const duplicateDirectKeys = await Conversation.aggregate([
    { $group: { _id: "$directKey", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  const plan = planLegacyMessages({ messages, validUserIds: userIds, existingConversations });
  const report = {
    dryRun,
    ...plan.report,
    duplicateDirectKeys: duplicateDirectKeys.length,
  };

  if (dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (duplicateDirectKeys.length) {
    throw new Error(
      `Migration stopped: found ${duplicateDirectKeys.length} duplicate directKey value(s)`
    );
  }

  let conversationsCreated = 0;
  let messagesUpdated = 0;

  for (const group of plan.groups) {
    let conversation = await Conversation.findOne({ directKey: group.directKey });
    if (!conversation) {
      try {
        conversation = await Conversation.findOneAndUpdate(
          { directKey: group.directKey },
          {
            $setOnInsert: {
              type: "direct",
              participants: group.participants,
              directKey: group.directKey,
              createdBy: group.createdBy,
            },
          },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
        conversationsCreated += 1;
      } catch (error) {
        if (error?.code !== 11000) throw error;
        conversation = await Conversation.findOne({ directKey: group.directKey });
      }
    }

    const updates = group.messages
      .filter((message) => message.conversationId?.toString() !== conversation._id.toString())
      .map((message) => ({
        updateOne: {
          filter: { _id: message._id },
          update: { $set: { conversationId: conversation._id } },
        },
      }));
    if (updates.length) {
      const result = await Message.bulkWrite(updates, { ordered: false });
      messagesUpdated += result.modifiedCount;
    }

    const latestMessage = group.messages.at(-1);
    await Conversation.updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessageId: latestMessage._id,
          lastMessageAt: latestMessage.createdAt,
        },
      }
    );
  }

  console.log(
    JSON.stringify(
      { ...report, conversationsCreated, messagesUpdated, status: "completed" },
      null,
      2
    )
  );
};

run()
  .catch((error) => {
    console.error("Conversation migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
