import express from "express";
import authRoutes from "./Routes/Signup.js";
import profileRoutes from "./Routes/Profile.js";

import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/", authRoutes);
app.use("/", profileRoutes);

const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API ready → http://0.0.0.0:${PORT}`);
});
