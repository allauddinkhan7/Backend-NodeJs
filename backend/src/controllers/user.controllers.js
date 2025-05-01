import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { subscribe } from "diagnostics_channel";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const userForToken = await User.findById(userId);
    const accessToken = userForToken.generateAccessToken();
    const refreshToken = userForToken.generateRefreshToken();

    //save refresh token
    userForToken.refreshToken = refreshToken;
    await userForToken.save({ validateBeforeSave: true });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generateAccessAndRefreshTokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /*
  get user details from FE,
  validation(no field empty), 
  check if already exists,  
  check for imgs and avatar,
  upload them to cloudinary,
  create user obj bcs we are using MongoDB that is no sql,  create entry in DB, select the fields which you don't want
  remove password and refresh token from response bcz whatevet we stored comes back in response and then we have to pass data to FE,
  check for user creation is it null or created,
  return response
  */
  console.log("user--------------", req.body);
  //get user details from FE
  const { fullName, email, userName, password } = req.body;
 

  //validation(no field empty),
  // if (
  //   [fullName, email, userName, password].some((field) => field?.trim() === "")
  // ) {
  //   throw new ApiError(400, "All fields are required");
  // }
  // Check if any fields are empty
  if ([fullName, email, userName, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }
 
  //check if already exists,
  const existedUser = await User.findOne({
    $or: [
      //give values to check
      { userName },
      { email },
    ],
  });

  if (existedUser) throw new ApiError(409, "User already exists");

  // check for imgs and avatar,   multer gives us access to files

  console.log("req.files..........", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path; //multer has access to the locally file
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Error uploading avatar");
  }

  // create entry in DB
  const isUserStored = await User.create({
    fullName,
    email,
    userName: userName.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || null,
  });

  const createdUser = await User.findById(isUserStored._id).select(
    //.select() is for mentioning fields you don't want to send to FE
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));

  // now make route for this registerUser in src/routes/user.routes.js
});

const loginUser = asyncHandler(async (req, res) => {
  /*
    get user details from FE,
    make sure email and password are not empty,
    check if user exists,
    verify password
    generate access amd refresh token,
    and send it to FE using cookie
    return response
  */

  //  get user details from FE,
  const { userName, email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "userName or email is required");
  }

  // check if user exists,
  const existedUser = await User.findOne({
    $or: [
      //give values to check
      { userName },
      { email },
    ],
  });

  if (!existedUser) {
    throw new ApiError(404, "No record found");
  }

  //verify password
  const isPasswordValid = await existedUser.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password ");
  }

  // generate access amd refresh token,
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    existedUser._id
  );
  const loggedInUser = await User.findById(existedUser._id).select(
    "-password -refreshToken"
  );
  //send it using cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, //sending accessToken refreshToken again for FE needs may FE wants to store it in localStorage
        },
        "User logged In Successfully"
      )
    );

});

const logOutUser = asyncHandler(async (req, res, next) => {
  /*
  findUser but we don't have access to user in this method
  so we will use middleware i.e auth.middleware.js in which we will verify user token if its verified we will add an Object xyz in req
  clear cookie first and reset refresh Token
  */

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // we will get the updated value in response that is undefined
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    (await req.cookies.refreshToken) || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "UnAuthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id); // we stored _id when generateRefreshToken() so we have access to it
    if (!user) {
      throw new ApiError(400, "Invalid refresh Token");
    }
    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or used");

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("newRefreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "failed refreshing token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  console.log("getCurrentUser",req)
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id); //user?._id from authMiddleware

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields required");
  }

  const user = await User.findByIdAndUpdate(
    //id
    req.user?._id, //find user
    //req.body
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true, // we will get the updated value in response
    }
  ).select("-password");
  return res.status(200).json(new ApiResponse(200, {}, "User updated"));
});
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    throw new ApiError(400, "user not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "user deleted successully"));
});

const updateUserAvatar = asyncHandler(async (res, req) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
  if (!uploadedAvatar.url) {
    throw new ApiError(400, "Error uploading Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: uploadedAvatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "Avatar updated"));
});

const updateCoverImage = asyncHandler(async (res, req) => {
  const coverImagePath = req.file?.path;
  if (!coverImagePath) {
    throw new ApiError(400, "cover image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImagePath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error uploading cover image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  //we want channel profile so we go that url
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "userName is missing");
  }

  const channel = await User.aggregate([
    //piplines
    //filtering document
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    //we got the User ex: Chai or code now count subscribers
    //joining Documents => $lookUp
    //how many subscribers
    {
      $lookup: {
        from: "subscriptions", //-> subscription.model.js when MongiDB stores it lowerCase and plural form
        localField: "_id",
        foreignField: "channel", //choose channel and count documents we will get subscribers
        as: "subscribers",
      },
    },
    //how many channels did I subscribed
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", //select subcriber value i.e moiz and its present in Document1 and Documents. so moiz subscribed 2 channels
        as: "subscribedTo",
      },
    },
    //adding fields in User Object
    {
      $addFields: {
        // it will keep old fields and will add the following one's
        subscriberCount: {
          $size: "$subscribers", //counting subscribers
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            //in subbscribers checking whether I'm present in it or not
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    //filering what to pass to FE
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribed: 1,
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
      },
    },
  ]);
  console.log("aggregate returns-------------", channel);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }
  return res.status.json(
    new ApiResponse(200, channel, "User channel Fetched Successfully")
  );
});

const getUserHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          //strucing data: lookup gives in array so take data out of that array and pass in obj to FE
          {
            $addFields: {
              owner: {
                $first: "$owner ",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getUserHistory,
};

/*
if no asyncHandler then use this code

export const registerUser = async (req, res) => {
  res.status(200).json({ message: "ok" });   
}; 


*/
