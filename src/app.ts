import express from "express";
import { connectDB } from "./utils/features";
import { errorMiddleware } from "./middlewares/error.middleware";
import NodeCache from "node-cache";
import morgan from "morgan";
import { config } from "dotenv";
import Stripe from "stripe";
import cors from "cors";

import userRouter from "./routes/user.route";
import productRouter from "./routes/product.route";
import orderRouter from "./routes/order.route";
import paymentRouter from "./routes/payment.route";
import dashboardRouter from "./routes/stats.route";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";

connectDB(mongoUri);

const app = express();

export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/api/v1", (req, res) => {
  res.send("Hello");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server listening on http://localhost/${port}`);
});
