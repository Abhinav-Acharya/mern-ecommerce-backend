import mongoose from "mongoose";
import { myCache } from "../app";
import { Product } from "../models/product.model";
import { FuncProps, InvalidateCacheProps, OrderItemType } from "../types/types";

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "NovaBuy",
    })
    .then(() => console.log("DB connected"))
    .catch((error) => console.log(error));
};

export const invalidateCache = ({
  product,
  admin,
  order,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((id) => {
        productKeys.push(`product-${id}`);
      });

    myCache.del(productKeys);
  }

  if (admin) {
    myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }

  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    myCache.del(orderKeys);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);

    if (!product) throw new Error("Product not found");

    product.stock -= order.quantity;

    await product.save();
  }
};

export const calcPercent = (currentMonth: number, previousMonth: number) => {
  if (previousMonth === 0) return currentMonth * 100;
  const percent = (currentMonth / previousMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getCategoriesPercent = async ({
  categories,
  productCount,
}: {
  categories: string[];
  productCount: number;
}) => {
  const categoriesCount = await Promise.all(
    categories.map((category) => Product.countDocuments({ category }))
  );

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productCount) * 100),
    });
  });

  return categoryCount;
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      data[length - monthDiff - 1] += property ? i[property] : 1;
    }
  });

  return data;
};
