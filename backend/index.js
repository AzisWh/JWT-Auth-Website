import express from "express";
import db from "./config/database.js";
import router from "./routes/index.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
const app = express();

// memastikan koneksi
try {
  await db.authenticate();
  console.log("connected");
  //sequelize mengeksekusi tabel
  //   await Users.sync();
} catch (error) {
  console.error("error :", error);
}

app.use(cors({ origin: "http://localhost:3000", credentials: true })); //akses api
app.use(cookieParser());
app.use(express.json()); //menerima data json
app.use(router);

app.listen(5000, () => console.log("listening on port 5000"));
