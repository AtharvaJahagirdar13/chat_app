import Conversation from "../models/conversation.model.js";
import { isConversationParticipant } from "../lib/conversation.js";
import { isValidObjectId } from "../lib/validation.js";

export const requireConversationMember = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationParticipant(conversation, req.user._id)) {
      return res.status(403).json({ message: "Forbidden - Not a conversation participant" });
    }

    req.conversation = conversation;
    return next();
  } catch (error) {
    console.error("Error authorizing conversation membership:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
