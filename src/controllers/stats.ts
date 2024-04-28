import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from "../utils/features.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats;

  if (myCache.has("admin-stats"))
    stats = JSON.parse(myCache.get("admin-stats") as string);
  else {
    const today = new Date();
    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),

      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastsixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    });

    const latestTransactionsPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const [
      thisMonthUsers,
      thisMonthProducts,
      thisMonthOrders,
      lastMonthUsers,
      lastMonthProducts,
      lastMonthOrders,
      productsCount,
      usersCount,
      allOrders,
      lastsixMonthOrders,
      categories,
      femaleUsers,
      latestTransaction,
    ] = await Promise.all([
      thisMonthUsersPromise,
      thisMonthProductsPromise,
      thisMonthOrdersPromise,
      lastMonthUsersPromise,
      lastMonthProductsPromise,
      lastMonthOrdersPromise,
      Product.countDocuments(), // query for counting products
      User.countDocuments(), // query for counting products
      Order.find({}).select("total"), // query for counting products
      lastsixMonthOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionsPromise,
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const changePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue), // it is in percentage
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),

      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),

      order: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const count = {
      revenue,
      user: usersCount,
      product: productsCount,
      order: allOrders.length,
    };

    const orderMonthCounts = getChartData({
        length: 6,
        today,
        docArr: lastsixMonthOrders,
        
      });


    const orderMonthRevenue = getChartData({
        length: 6,
        today,
        docArr: lastsixMonthOrders,
        property:"total"
      });



    const categoryCount: Record<string, number>[] = await getInventories({
      categories,
      productsCount,
    });

    const userRatio = {
      male: usersCount - femaleUsers,
      female: femaleUsers,
    };

    const modifiedLastestTransaction = latestTransaction.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      categoryCount,
      changePercent,
      count,
      charts: {
        order: orderMonthCounts,
        revenue: orderMonthRevenue,
      },
      userRatio,
      latestTransaction: modifiedLastestTransaction,
    };
    

    myCache.set("admin-stats", JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  if (myCache.has("admin-pie-charts"))
    charts = JSON.parse(myCache.get("admin-pie-charts") as string);
  else {
    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCount,
      productsOutOfStock,
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
      Order.find({}).select([
        "total",
        "discount",
        "subtotal",
        "tax",
        "shippingCharges",
      ]),
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFullfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const productCategories: Record<string, number>[] = await getInventories({
      categories,
      productsCount,
    });

    const stockAvailability = {
      inStock: productsCount - productsOutOfStock,
      outOfStock: productsOutOfStock,
    };

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    ); // considering that customer is not paying shippingCharges

    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0); // only the tax is burnt

    const marketingCost = Math.round(grossIncome * (30 / 100));

    const netMargin =
      grossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      grossIncome,
      discount,
      productionCost,
      burnt,
      marketingCost,
      netMargin,
    };

    const adminCustomer = {
      admin: adminUsers,
      customer: customerUsers,
    };

    const usersAgeGroup = {
      teen: allUsers.filter((i) => i.age < 18).length,
      adult: allUsers.filter((i) => i.age >= 18 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };

    charts = {
      orderFullfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      adminCustomer,
      usersAgeGroup,
    };

    myCache.set("admin-pie-charts", JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;

  const key = `admin-bar-chart`;

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const twelveMonthAgo = new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

    const sixMonthProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthAgo, //gte means greated than or equal to
        $lte: today, // lte means less than or equal to
      },
    }).select("createdAt");

    const sixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthAgo, //gte means greated than or equal to
        $lte: today, // lte means less than or equal to
      },
    }).select("createdAt");
    const twelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthAgo, //gte means greated than or equal to
        $lte: today, // lte means less than or equal to
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      sixMonthProductPromise,
      sixMonthUsersPromise,
      twelveMonthOrdersPromise,
    ]);

    const productCount = getChartData({ length: 6, today, docArr: products });

    const usersCount = getChartData({ length: 6, today, docArr: users });

    const ordersCount = getChartData({ length: 12, today, docArr: orders });
    // length is the number of months

    charts = {
      users: usersCount,
      products: productCount,
      orders: ordersCount,
    };

    myCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;

  const key = `admin-line-chart`;

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const twelveMonthAgo = new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthAgo, //gte means greated than or equal to
        $lte: today, // lte means less than or equal to
      },
    };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
    ]);

    const productCount = getChartData({ length: 12, today, docArr: products });

    const usersCount = getChartData({ length: 12, today, docArr: users });

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
      users: usersCount,
      products: productCount,
      discount,
      revenue,
    };

    // myCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});
