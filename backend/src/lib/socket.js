import { Server } from "socket.io";
import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { getClientOrigin } from "./config.js";

const app = express();
const server = http.createServer(app);
const clientOrigin = getClientOrigin();

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowRequest: (request, callback) => {
    callback(null, request.headers.origin === clientOrigin);
  },
});

const parseCookies = cookieParser();

io.use((socket, next) => {
  parseCookies(socket.request, {}, async (cookieError) => {
    if (cookieError) return next(new Error("Unauthorized"));

    const token = socket.request.cookies?.jwt;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.userId) return next(new Error("Unauthorized"));

      const userExists = await User.exists({ _id: decoded.userId });
      if (!userExists) return next(new Error("Unauthorized"));

      socket.data.userId = decoded.userId.toString();
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.data.userId;
  userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userSocketMap[userId] === socket.id) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
