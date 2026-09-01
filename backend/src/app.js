import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { app } from "./lib/socket.js";
import authRoutes from "./routes/auth.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";

if (!app.locals.apiConfigured) {
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "2mb" }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/users", userRoutes);
  app.locals.apiConfigured = true;
}

export default app;
