import jwt from "jsonwebtoken";

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
});

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    ...getCookieOptions(),
  });

  return token;
};

export const clearToken = (res) => {
  res.cookie("jwt", "", {
    maxAge: 0,
    ...getCookieOptions(),
  });
};

export const serializeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  profilePic: user.profilePic,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const serializePublicUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  profilePic: user.profilePic,
});
