import { Router } from "express";
import { loginUser, logOutUser, registerUser } from "../controllers/user.controllers.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";
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
    ]),     
    registerUser
);


router.route("/login").post(loginUser)


//protected routes

router.route("/logout").post(verifyJwt, logOutUser)

export default router;
