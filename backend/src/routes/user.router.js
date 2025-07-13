import { Router } from "express";
import {
  changeCurrentPassword,
  deleteUser,
  getCurrentUser,
  getUserChannelProfile,
  getUserHistory,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  updateCoverImage,
  updateUser,
  updateUserAvatar,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    //avatar and cover pic
    {
      name: "avatar",
      maxCount: 1, //will accept 1 file 
    },
    {
      name: "coverImage",
      maxCount: 1,
    }, 
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//protected routes verifyJwt => making sure only logged in user perform these activities
router.route("/logout").post(verifyJwt, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-user").patch(verifyJwt, updateUser); //patch to make sure donot update all the details
router.route("/delete-user").delete(deleteUser);
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(verifyJwt, getUserChannelProfile);
router.route("/history").get(verifyJwt, getUserHistory);
 export default router;
