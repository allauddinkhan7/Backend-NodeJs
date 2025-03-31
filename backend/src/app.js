import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();
//configurations && always with "use"
app.use(cors({
    origin: 'http://localhost:3000', // Next.js frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

//configuring limit for incoming JSON allowing only 16kb without these two middlewares we cannot read FE data from req.body
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))//extended-> when storing nested objects
//storing file and folder
app.use(express.static("public"))

//configuring cookies to access cookie anywhere
app.use(cookieParser())


//routes import
import userRouter from "./routes/user.router.js"
//routes declaration
app.use("/api/v1/users", userRouter) //when user hits /api/v1/users then giving control to userRouter

export {app} 