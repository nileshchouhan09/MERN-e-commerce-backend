import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import { NewCouponRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utiliy-class.js";
import { myCache, stripe } from "../app.js";

export const createPaymentIntent = TryCatch(
  async (req: Request<{}, {}, NewCouponRequestBody>, res, next) => {
    const { amount } = req.body;
    if (!amount)
      return next(new ErrorHandler("Please Enter amount", 400));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      currency: "inr",
    });

    return res.status(201).json({
      success: true,
      clientSecret:paymentIntent.client_secret
    });
  }
);

export const newCoupon = TryCatch(
  async (req: Request<{}, {}, NewCouponRequestBody>, res, next) => {
    const { code, amount } = req.body;
    if (!code || !amount)
      return next(new ErrorHandler("Please Enter Both Information", 400));
    await Coupon.create({ code, amount });

    return res.status(201).json({
      success: true,
      message: `Coupon ${code} Created Successfully`,
    });
  }
);

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { code } = req.query;

  const discount = await Coupon.findOne({ code });

  if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));

  return res.status(200).json({
    success: true,
    discount: discount.amount,
  });
});

export const allCoupon = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});

  if (!coupons) return next(new ErrorHandler("No Coupon Code", 400));

  return res.status(200).json({
    success: true,
    coupons,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("Invalid Coupon  ID", 400));

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon?.code} Deleted Successfully`,
  });
});
