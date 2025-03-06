import mongoose from "mongoose";
import { DB_NAME } from "../contants.js";

const connectDB = async () => {
  try {
    const connInst = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`MongoDB Connected: ${connInst.connection.host}`);
  } catch (error) {
    console.log("ConnectDB Error: ", error);
    process.exit(1);
  }
};


export default connectDB;