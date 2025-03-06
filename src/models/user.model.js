import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// direct encryption is not possible so we use some mongoose hooks to encrypt the password

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //when we search by username, it will be faster
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true, //when we search by username, it will be faster
    },
    avatar: {
      type: String, //cloudinary url
      required: true,
    },
    avatar: {
      type: String, //cloudinary url
    },
    watchlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//password encryption
userSchema.pre("save", async function (next) {
  // .pre is a middleware, it will run before saving the data and it will encrypt the password
  //its middleware so we have to call next() to move to next middleware
  if (!this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password, 10);
  next();
});

//now when is logging validating password is correct or not, bcz we saved the password in encrypted form
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//generating access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign( 
        {//what info u want to store in token
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
    }, 
    process.env.ACCESS_TOKEN_SECRET, //secret key
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY, 
    }
)
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign( 
        {
        _id: this._id,
        
    }, 
    process.env.REFRESH_TOKEN_SECRET, //secret key
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY, 
    }

    ) }


export const User = mongoose.model("User", userSchema);
