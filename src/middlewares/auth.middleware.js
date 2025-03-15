//user exist or or not
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";
export const verifyJwt = asyncHandler(async (req, _, next) => { //not using res so put _ instead
  try {
    req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
  
    if (!token) {
      throw new ApiError(401, "Unauthorized req");
    }
    //if (token)
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id) //ref to this _id -> user.model.js -> jwt.sign({_id})
      .select("-password -refreshToken");
  
      if (!user) {
          throw new ApiError(401, "invalid Access Token");
      }
  
      //add that Object 
      req.moiz = user;
      next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token ");
    
  }
});
