import express from "express";
import { errorMiddleware } from "./middlewares/error.js";
import { connectDB } from "./utils/features.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";

//importing routes
import userRoutes from "./routes/user.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import dashboardRoutes from "./routes/stats.js";

config({
  path: "./.env",
});
// checking the env file
// console.log(process.env.PORT)

const port = process.env.PORT || 4000;

const mongoURI = process.env.MONGO_URI || "";

const stripeKey = process.env.STRIPE_KEY || "";




connectDB(mongoURI);

export const stripe = new Stripe(stripeKey);

export const myCache = new NodeCache();

const app = express();
app.use(express.json());
app.use(morgan("dev"));
// const corsOptions = {
//   // AccessControlAllowOrigin: '*',
//   origin: 'http://localhost:5173',
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' ,
//   Credential:true
// }
app.use(cors());


//Using routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is working on ${port}`);
});
