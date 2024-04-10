import { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/error.middleware";
import { INewOrderReqBody } from "../types/types";
import { Order } from "../models/order.model";
import { invalidateCache, reduceStock } from "../utils/features";
import ErrorHandler from "../utils/utility-class";
import { myCache } from "../app";

const myOrders = tryCatch(async (req, res, next) => {
  const { id: user } = req.query;
  let orders = [];
  const key = `my-orders-${user}`;
  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find({ user });
    myCache.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({ success: true, orders });
});

const allOrders = tryCatch(async (req, res, next) => {
  let orders = [];
  const key = "all-orders";
  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find().populate("user", "name");
    myCache.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({ success: true, orders });
});

const getOrderDetails = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `order-${id}`;

  let order;

  if (myCache.has(key)) order = JSON.parse(myCache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name");

    if (!order) return next(new ErrorHandler("Order not found", 404));

    myCache.set(key, JSON.stringify(order));
  }

  return res.status(200).json({ success: true, order });
});

const newOrder = tryCatch(
  async (
    req: Request<{}, {}, INewOrderReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subTotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;

    if (!shippingInfo || !user || !orderItems || !subTotal || !tax || !total)
      return next(new ErrorHandler("No order added", 400));

    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subTotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    await reduceStock(orderItems);

    invalidateCache({
      product: true,
      admin: true,
      order: true,
      userId: user,
      productId: order.orderItems.map((item) => String(item.productId)),
    });

    return res
      .status(201)
      .json({ success: true, message: "Order placed successfully" });
  }
);

const processOrder = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  invalidateCache({
    product: false,
    admin: true,
    order: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res
    .status(201)
    .json({ success: true, message: "Order processed successfully" });
});

const deleteOrder = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  await order.deleteOne();

  await invalidateCache({
    product: false,
    admin: true,
    order: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res
    .status(201)
    .json({ success: true, message: "Order deleted successfully" });
});

export {
  newOrder,
  getOrderDetails,
  myOrders,
  allOrders,
  processOrder,
  deleteOrder,
};
