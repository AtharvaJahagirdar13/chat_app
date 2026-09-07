import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { app } from "./lib/socket.js";
import authRoutes from "./routes/auth.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import { getClientOrigin } from "./lib/config.js";

if (!app.locals.apiConfigured) {
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "2mb" }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: getClientOrigin(),
      credentials: true,
    })
  );

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/users", userRoutes);
  app.locals.apiConfigured = true;
}

export default app;
