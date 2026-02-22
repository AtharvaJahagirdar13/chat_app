import express from "express"
import dotenv from "dotenv"
import cors from  "cors"
import cookieParser from "cookie-parser"
dotenv.config()

const app = express()

import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import { connectDB } from "./lib/db.js"

const PORT = process.env.PORT

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes)
app.use("/api/message", messageRoutes);
app.use(cors({
    origin: "http://localhost:5173",
    credentials:true,

}))

app.listen(PORT,() =>{
    console.log("server is running on port:" + PORT)
    connectDB()

})