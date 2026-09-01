import cloudinary from "../lib/cloudinary.js";
import { canonicalDirectKey, serializeConversation } from "../lib/conversation.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import {
  isValidImageData,
  isValidObjectId,
  MAX_MESSAGE_LENGTH,
} from "../lib/validation.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const populateConversation = (query) =>
  query
    .populate("participants", "_id fullName profilePic")
    .populate("lastMessageId", "conversationId senderId receiverId text image createdAt");

export const getConversations = async (req, res) => {
  try {
    const conversations = await populateConversation(
      Conversation.find({ participants: req.user._id }).sort({
        lastMessageAt: -1,
        createdAt: -1,
        _id: -1,
      })
    );

    return res.status(200).json(conversations.map(serializeConversation));
  } catch (error) {
    console.error("Error listing conversations:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversation = async (req, res) => {
  try {
    const conversation = await populateConversation(
      Conversation.findById(req.conversation._id)
    );
    return res.status(200).json(serializeConversation(conversation));
  } catch (error) {
    console.error("Error fetching conversation:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createDirectConversation = async (req, res) => {
  try {
    const { participantId } = req.body || {};
    if (!isValidObjectId(participantId)) {
      return res.status(400).json({ message: "Invalid participant ID" });
    }
    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot start a conversation with yourself" });
    }

    const participant = await User.exists({ _id: participantId });
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const directKey = canonicalDirectKey(req.user._id, participantId);
    let conversation;
    try {
      conversation = await Conversation.findOneAndUpdate(
        { directKey },
        {
          $setOnInsert: {
            type: "direct",
            participants: [req.user._id, participantId],
            directKey,
            createdBy: req.user._id,
          },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      if (error?.code !== 11000) throw error;
      conversation = await Conversation.findOne({ directKey });
    }

    conversation = await populateConversation(Conversation.findById(conversation._id));
    return res.status(200).json(serializeConversation(conversation));
  } catch (error) {
    console.error("Error creating direct conversation:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.conversation._id }).sort({
      createdAt: 1,
      _id: 1,
    });
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching conversation messages:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendConversationMessage = async (req, res) => {
  try {
    const { text, image } = req.body || {};
    if (text !== undefined && typeof text !== "string") {
      return res.status(400).json({ message: "Message text must be a string" });
    }

    const normalizedText = typeof text === "string" ? text.trim() : "";
    if (normalizedText.length > MAX_MESSAGE_LENGTH) {
      return res
        .status(400)
        .json({ message: `Message text must be at most ${MAX_MESSAGE_LENGTH} characters` });
    }

    const hasImage = image !== undefined && image !== null && image !== "";
    if (hasImage && !isValidImageData(image)) {
      return res.status(400).json({ message: "Image must be a supported image under 1.5 MB" });
    }
    if (!normalizedText && !hasImage) {
      return res.status(400).json({ message: "A message must contain text or an image" });
    }

    const receiverId = req.conversation.participants.find(
      (participantId) => participantId.toString() !== req.user._id.toString()
    );
    if (!receiverId) {
      return res.status(409).json({ message: "Conversation has invalid participants" });
    }

    let imageUrl;
    if (hasImage) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const message = await Message.create({
      conversationId: req.conversation._id,
      senderId: req.user._id,
      receiverId,
      text: normalizedText || undefined,
      image: imageUrl,
    });

    await Conversation.updateOne(
      {
        _id: req.conversation._id,
        $or: [
          { lastMessageAt: null },
          { lastMessageAt: { $lt: message.createdAt } },
          { lastMessageAt: message.createdAt, lastMessageId: { $lt: message._id } },
        ],
      },
      { $set: { lastMessageId: message._id, lastMessageAt: message.createdAt } }
    );

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", message);

    return res.status(201).json(message);
  } catch (error) {
    console.error("Error sending conversation message:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
