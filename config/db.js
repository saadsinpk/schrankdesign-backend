import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      // colors.bgMagenta.white(
        `Connected to mongo db database ${conn.connection.host}`
      // )
    );
  } catch (err) {
    console.log(colors.bgRed.white("MongoDB Error"));
  }
};
export default connectDB;
