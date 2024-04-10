import { stripe } from "../app";
import { tryCatch } from "../middlewares/error.middleware";
import { Coupon } from "../models/coupon.model";
import ErrorHandler from "../utils/utility-class";

const getAllCoupons = tryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});

  if (coupons.length === 0)
    return next(new ErrorHandler("No coupons added", 400));

  return res.status(201).json({
    success: true,
    coupons,
  });
});

const deleteCoupon = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("No coupons added", 400));

  return res.status(201).json({
    success: true,
    message: `Coupon ${coupon.code} deleted successfully`,
  });
});

const createPaymentIntent = tryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) return next(new ErrorHandler("Please enter the amount", 400));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "inr",
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

const createCoupon = tryCatch(async (req, res, next) => {
  const { coupon, amount } = req.body;

  if (!coupon || !amount)
    return next(new ErrorHandler("One of the fields is missing", 400));

  await Coupon.create({ code: coupon, amount });

  return res.status(201).json({
    success: true,
    message: `Coupon ${coupon} created successfully`,
  });
});

const applyDiscount = tryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  const discount = await Coupon.findOne({ code: coupon });

  if (!discount) return next(new ErrorHandler("Coupon code invalid", 400));

  return res.status(200).json({
    success: true,
    message: discount.amount,
  });
});

export {
  createCoupon,
  applyDiscount,
  getAllCoupons,
  deleteCoupon,
  createPaymentIntent,
};
