const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {}),
      console.log("connect to db");
  } catch (err) {
    console.error("error connecting to db", err);
    process.exit(1);
  }
};

module.exports = connectDB;
