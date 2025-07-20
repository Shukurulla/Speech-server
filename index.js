import express from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import UserRouter from "./routes/user.routes.js";
import CategoryRouter from "./routes/category.routes.js";
import TestRouter from "./routes/test.routes.js";
import testDetailRouter from "./routes/test.details.routes.js";
import cors from "cors";
config();

const app = express();
const port = process.env.PORT;
const mongo_uri = process.env.MONGO_URI;
mongoose.connect(mongo_uri).then(() => {
  console.log("database connected");
});

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", UserRouter);
app.use("/api/category", CategoryRouter);
app.use("/api/test", TestRouter);
app.use("/api/test-detail", testDetailRouter);

app.listen(port, () => {
  console.log(`server has been started on port - ${port}`);
});
