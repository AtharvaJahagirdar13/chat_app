import { clearToken, generateToken, serializeUser } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { isValidEmail, isValidImageData, normalizeEmail } from "../lib/validation.js";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};
    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedFullName = fullName.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedFullName || normalizedFullName.length > 100) {
      return res.status(400).json({ message: "Full name must be between 1 and 100 characters" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (password.length > 72) {
      return res.status(400).json({ message: "Password must be at most 72 characters" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (user) return res.status(409).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: normalizedFullName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    if (newUser) {
      await newUser.save();
      generateToken(newUser._id, res);

      res.status(201).json(serializeUser(newUser));
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }

    console.log("Error in signup controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail) || !password) {
      return res.status(400).json({ message: "A valid email and password are required" });
    }

    if (password.length > 72) {
      return res.status(400).json({ message: "Password must be at most 72 characters" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json(serializeUser(user));
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    clearToken(res);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body || {};
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    if (!isValidImageData(profilePic)) {
      return res.status(400).json({ message: "Profile pic must be a supported image under 1.5 MB" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(serializeUser(updatedUser));
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(serializeUser(req.user));
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
