import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js"
import {upload} from "../middlewares/multer.middleware.js"
const router = Router();

router.route("/register").post(
    upload.fields([
        //avatar and cover pic
        {
            name: "avatar",
            maxCount: 1 //will accept 1 file
        },
        {
            name: "coverImage",
            maxCount: 1
        },
        {} 
    ]),     
    registerUser
);

export default router;
