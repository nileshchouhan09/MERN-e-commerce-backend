import express from "express";
import {
  allCoupon,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  newCoupon,
} from "../controllers/payment.js";
import { adminOnly } from "../middlewares/Auth.js";

const app = express.Router();

app.post("/create", createPaymentIntent); // payment route 

app.get("/discount", applyDiscount);

app.post("/coupon/new", adminOnly, newCoupon);

app.get("/coupon/all", adminOnly, allCoupon);

app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;
