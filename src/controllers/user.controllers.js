import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const registerUser = asyncHandler(async (req, res) => {
  //Register User
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
    //mention the fields which you don't want to send to FE
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});
export { registerUser };

// now make routes for this controller in src/routes/user.routes.js

/*
if no asyncHandler then use this code

export const registerUser = async (req, res) => {
  res.status(200).json({ message: "ok" });   
}; 


*/
