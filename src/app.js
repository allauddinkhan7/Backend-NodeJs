import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();
//configurations && always with "use"
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//configuring limit for incoming JSON allowing only 16kb
app.use(express.json({limit: "16kb"}))
//url encoder 
app.use(express.urlencoded({extended: true, limit: "16kb"}))//extended-> when storing nested objects
//storing file and folder
app.use(express.static("public"))

//configuring cookies
app.use(cookieParser())

export {app}