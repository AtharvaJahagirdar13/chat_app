import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { serializePublicUser } from "../lib/utils.js";
import {
  isValidImageData,
  isValidObjectId,
  MAX_MESSAGE_LENGTH,
} from "../lib/validation.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "_id fullName profilePic"
    );

    res.status(200).json(filteredUsers.map(serializePublicUser));
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!isValidObjectId(userToChatId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (myId.toString() === userToChatId) {
      return res.status(400).json({ message: "Cannot fetch a chat with yourself" });
    }

    const userToChat = await User.exists({ _id: userToChatId });
    if (!userToChat) {
      return res.status(404).json({ message: "User not found" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1, _id: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body || {};
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "You cannot send a message to yourself" });
    }

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

    const receiver = await User.exists({ _id: receiverId });
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let imageUrl;
    if (hasImage) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: normalizedText || undefined,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
