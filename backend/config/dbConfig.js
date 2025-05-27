import dotenv from "dotenv"
dotenv.config();
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI)
    } catch (error) {
        console.log("Error while connecting to the database",error)
    }

}

export default connectDB;

