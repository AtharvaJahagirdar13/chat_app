import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import path from "path";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import "./app.js";

const PORT = Number(process.env.PORT) || 5002;
const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
