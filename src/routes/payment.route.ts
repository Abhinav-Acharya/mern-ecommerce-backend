import express from "express";
import { adminOnly } from "../middlewares/auth.middleware";
import {
  applyDiscount,
  createCoupon,
  createPaymentIntent,
  deleteCoupon,
  getAllCoupons,
} from "../controllers/payment.controller";

const router = express.Router();

router.post("/create", createPaymentIntent);
router.post("/coupon/new", adminOnly, createCoupon);
router.get("/coupon/all", adminOnly, getAllCoupons);
router.get("/discount", applyDiscount);
router.delete("/coupon/:id", adminOnly, deleteCoupon);

export default router;
