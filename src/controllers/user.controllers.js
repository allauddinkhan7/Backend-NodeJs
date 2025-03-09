import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  // code here
  res.status(200).json({
    message: "ok",
  });
});
export { registerUser };
// now make routes for this controller in src/routes/user.routes.js
