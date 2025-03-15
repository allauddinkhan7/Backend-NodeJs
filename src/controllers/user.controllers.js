import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  //get user details from FE
  const { fullName, email, userName, password } = req.body;
  //validation(no field empty),
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
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

  if (!userName || !email) {
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

  //now set route for this loggedInUser
});

const logOutUser = asyncHandler(async () => {
  /*
  findUser but we don't have access to user in this method
  so we will use middleware i.e auth.middleware.js in which we will verify user token if its verified we will add an Object xyz in req
  clear cookie first and reset refresh Token
  */

  await User.findByIdAndUpdate(
    req.moiz._id,
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

  return res.status(200).clearCookie("accessToken", options)
  .clearCookie("refreshToken", options )
  .json(new ApiResponse(200, {}, "User logged Out"))


});

export { registerUser, loginUser, logOutUser };

/*
if no asyncHandler then use this code

export const registerUser = async (req, res) => {
  res.status(200).json({ message: "ok" });   
}; 


*/
