const DEVELOPMENT_CLIENT_ORIGIN = "http://localhost:5173";
const VALID_COOKIE_SAME_SITE_VALUES = new Set(["strict", "lax", "none"]);

const readValue = (name) => process.env[name]?.trim();

export const getClientOrigin = () => {
  const configuredOrigin = readValue("CLIENT_ORIGIN");

  if (!configuredOrigin) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CLIENT_ORIGIN is required in production");
    }
    return DEVELOPMENT_CLIENT_ORIGIN;
  }

  let parsedOrigin;
  try {
    parsedOrigin = new URL(configuredOrigin);
  } catch {
    throw new Error("CLIENT_ORIGIN must be a valid absolute URL");
  }

  if (!["http:", "https:"].includes(parsedOrigin.protocol)) {
    throw new Error("CLIENT_ORIGIN must use http or https");
  }

  if (
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error("CLIENT_ORIGIN must contain only the frontend origin");
  }

  const isLocalOrigin = ["localhost", "127.0.0.1", "::1"].includes(parsedOrigin.hostname);
  if (process.env.NODE_ENV === "production" && parsedOrigin.protocol !== "https:" && !isLocalOrigin) {
    throw new Error("CLIENT_ORIGIN must use HTTPS in production");
  }

  return parsedOrigin.origin;
};

export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = readValue("COOKIE_SAME_SITE")?.toLowerCase() || "strict";

  if (!VALID_COOKIE_SAME_SITE_VALUES.has(sameSite)) {
    throw new Error("COOKIE_SAME_SITE must be strict, lax, or none");
  }

  if (sameSite === "none" && !isProduction) {
    throw new Error("COOKIE_SAME_SITE=none requires NODE_ENV=production and HTTPS");
  }

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/",
  };
};

export const validateRuntimeConfig = () => {
  const requiredVariables = ["MONGODB_URI", "JWT_SECRET"];

  if (process.env.NODE_ENV === "production") {
    requiredVariables.push(
      "CLIENT_ORIGIN",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET"
    );
  }

  const missingVariables = requiredVariables.filter((name) => !readValue(name));
  if (missingVariables.length) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`);
  }

  if (process.env.NODE_ENV === "production" && readValue("JWT_SECRET").length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }

  const port = Number(process.env.PORT || 5002);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  getClientOrigin();
  getCookieOptions();

  return { port };
};
