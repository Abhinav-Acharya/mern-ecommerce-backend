import { myCache } from "../app";
import { tryCatch } from "../middlewares/error.middleware";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import {
  calcPercent,
  getCategoriesPercent,
  getChartData,
} from "../utils/features";

const getDashboardStats = tryCatch(async (req, res, next) => {
  let stats = {};

  const key = "admin-stats";

  if (myCache.has(key)) stats = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const currentMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const previousMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const currentMonthProductsPromise = Product.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    const previousMonthProductsromise = Product.find({
      createdAt: {
        $gte: previousMonth.start,
        $lte: previousMonth.end,
      },
    });

    const currentMonthUsersPromise = User.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    const previousMonthUsersPromise = User.find({
      createdAt: {
        $gte: previousMonth.start,
        $lte: previousMonth.end,
      },
    });

    const currentMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    const previousMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: previousMonth.start,
        $lte: previousMonth.end,
      },
    });

    const previousSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    const latestTransactionsPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const [
      currentMonthProducts,
      previousMonthProducts,
      currentMonthUsers,
      previousMonthUsers,
      currentMonthOrders,
      previousMonthOrders,
      productCount,
      userCount,
      allOrders,
      previousSixMonthOrders,
      categories,
      femaleUserCount,
      latestTransactions,
    ] = await Promise.all([
      currentMonthProductsPromise,
      previousMonthProductsromise,
      currentMonthUsersPromise,
      previousMonthUsersPromise,
      currentMonthOrdersPromise,
      previousMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      previousSixMonthOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionsPromise,
    ]);

    const currentMonthRevenue = currentMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const previousMonthRevenue = previousMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const percentChange = {
      revenue: calcPercent(currentMonthRevenue, previousMonthRevenue),
      product: calcPercent(
        currentMonthProducts.length,
        previousMonthProducts.length
      ),
      user: calcPercent(currentMonthUsers.length, previousMonthUsers.length),
      order: calcPercent(currentMonthOrders.length, previousMonthOrders.length),
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const count = {
      user: userCount,
      product: productCount,
      order: allOrders.length,
      revenue,
    };

    const orderMonthCount = getChartData({
      length: 6,
      today,
      docArr: previousSixMonthOrders,
    });

    const orderMonthRevenue = getChartData({
      length: 6,
      today,
      docArr: previousSixMonthOrders,
      property: "total",
    });

    const categoryCount = await getCategoriesPercent({
      categories,
      productCount,
    });

    const userRatio = {
      male: userCount - femaleUserCount,
      female: femaleUserCount,
    };

    const modifiedlatestTransactions = latestTransactions.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      count,
      categoryCount,
      percentChange,
      chart: { order: orderMonthCount, revenue: orderMonthRevenue },
      userRatio,
      latestTransactions: modifiedlatestTransactions,
    };

    myCache.set(key, JSON.stringify(stats));
  }

  return res.status(200).json({ success: true, stats });
});

const getPieChart = tryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-pie-charts";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const allOrdersPromise = Order.find({}).select([
      "total",
      "discount",
      "subTotal",
      "tax",
      "shippingCharges",
    ]);

    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productCount,
      outOfStockProducts,
      allOrders,
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFulfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const productCategories = await getCategoriesPercent({
      categories,
      productCount,
    });

    const stockAvailability = {
      inStock: productCount - outOfStockProducts,
      outOfStock: outOfStockProducts,
    };

    const totalGrossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const totalDiscount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

    const marketingCost = Math.round(totalGrossIncome * (30 / 100));

    const netMargin =
      totalGrossIncome - totalDiscount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      totalDiscount,
      productionCost,
      burnt,
      marketingCost,
      netMargin,
    };

    const userAgeGroup = {
      teen: allUsers.filter((i) => i.age < 20).length,
      adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminUsers,
      customers: customerUsers,
    };

    charts = {
      orderFulfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      adminCustomer,
      userAgeGroup,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({ success: true, charts });
});

const getBarChart = tryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-bar-charts";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    const sixMonthProductsPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const sixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const twelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      sixMonthProductsPromise,
      sixMonthUsersPromise,
      twelveMonthOrdersPromise,
    ]);

    const productCount = getChartData({ length: 6, today, docArr: products });
    const userCount = getChartData({ length: 6, today, docArr: users });
    const orderCount = getChartData({ length: 12, today, docArr: orders });

    charts = {
      users: userCount,
      products: productCount,
      orders: orderCount,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({ success: true, charts });
});

const getLineChart = tryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-line-charts";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
    ]);

    const productCount = getChartData({ length: 12, today, docArr: products });
    const userCount = getChartData({ length: 12, today, docArr: users });

    const discount = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "discount",
    });

    const revenue = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "total",
    });

    charts = {
      products: productCount,
      users: userCount,
      discount,
      revenue,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({ success: true, charts });
});

export { getDashboardStats, getPieChart, getBarChart, getLineChart };
