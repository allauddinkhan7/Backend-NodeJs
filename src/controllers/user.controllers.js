import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
const registerUser = asyncHandler(async (req, res) => {
  //register User
  //get user details from FE, validation(no field empty), check if already exists, check for imgs and avatar, upload them to cloudinary, create user obj bcs using MongoDB is no sql, create entry in DB, remove password and refresh token from response bcz whatevet we stored comes back in response and then we have to pass data to FE, check for user creation is it null or created and return response ,
  const { fullName, email, userName, password } = req.body;
  console.log(fullName, email, userName, password);
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
});
export { registerUser };
// now make routes for this controller in src/routes/user.routes.js

/*
if no asyncHandler then use this code

export const registerUser = async (req, res) => {
  res.status(200).json({ message: "ok" });   
}; 


*/
