import User from "../models/user.model.js";
import { serializePublicUser } from "../lib/utils.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchUsers = async (req, res) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    if (!query) return res.status(200).json([]);

    const pattern = new RegExp(escapeRegex(query), "i");
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ fullName: pattern }, { email: pattern }],
    })
      .select("_id fullName profilePic")
      .sort({ fullName: 1, _id: 1 })
      .limit(20);

    return res.status(200).json(users.map(serializePublicUser));
  } catch (error) {
    console.error("Error searching users:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
