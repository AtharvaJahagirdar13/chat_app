import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import { io, server } from "./lib/socket.js";
import { validateRuntimeConfig } from "./lib/config.js";
import "./app.js";

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received; shutting down`);

  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  await new Promise((resolve) => io.close(resolve));
  await mongoose.disconnect();
  console.log("Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

const start = async () => {
  const { port } = validateRuntimeConfig();
  await connectDB();

  await new Promise((resolve, reject) => {
    const handleListenError = (error) => reject(error);
    server.once("error", handleListenError);
    server.listen(port, "0.0.0.0", () => {
      server.off("error", handleListenError);
      console.log(`Server listening on 0.0.0.0:${port}`);
      resolve();
    });
  });
};

start().catch(async (error) => {
  console.error("Server startup failed:", error.message);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
