import express from "express";
import {
  createDirectConversation,
  getConversation,
  getConversationMessages,
  getConversations,
  sendConversationMessage,
} from "../controllers/conversation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireConversationMember } from "../middleware/conversation.middleware.js";

const router = express.Router();

router.use(protectRoute);
router.get("/", getConversations);
router.post("/direct", createDirectConversation);
router.get("/:conversationId", requireConversationMember, getConversation);
router.get("/:conversationId/messages", requireConversationMember, getConversationMessages);
router.post("/:conversationId/messages", requireConversationMember, sendConversationMessage);

export default router;
