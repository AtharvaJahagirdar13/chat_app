import mongoose from "mongoose";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_DATA_PATTERN = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;

export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const isValidEmail = (email) =>
  typeof email === "string" && email.length <= 254 && EMAIL_PATTERN.test(email);

export const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.isObjectIdOrHexString(value);

export const isValidImageData = (image) => {
  if (typeof image !== "string") return false;

  const match = image.match(IMAGE_DATA_PATTERN);
  if (!match) return false;

  return Buffer.byteLength(match[2], "base64") <= MAX_IMAGE_BYTES;
};
