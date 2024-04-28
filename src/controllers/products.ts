// all the errors in the is because of the typescript and has no impact on website

import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  NewProductRequestBody,
  SearchRequestQuery,
  BaseQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utiliy-class.js";
import { mkdirSync, rm } from "fs";

import { faker } from "@faker-js/faker";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";

// Revalidate on new, update, delete product  && new order
export const getLatestProduct = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has("lastest-product"))
    products = JSON.parse(myCache.get("lastest-product") as string);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    // 1 for assending and -1 for descending. I used -1 so that i can get last uploaded product list

    myCache.set("lastest-product", JSON.stringify(products));
  }

  return res.status(201).json({
    sucess: true,
    products,
  });
});

// Revalidate on new, update, delete product  && new order

export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories"))
    categories = JSON.parse(myCache.get("categories") as string);
  else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  return res.status(201).json({
    sucess: true,
    categories,
  });
});

// Revalidate on new, update, delete product  && new order

export const getAdminProduct = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products") as string);
  else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }
  return res.status(201).json({
    sucess: true,
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;
  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product Not Found ", 404));
    myCache.set(`product-${id}`, JSON.stringify(product));
    // saved product with id so that whenever request made for new product the old product will not show
  }

  return res.status(201).json({
    success: true,
    product,
  });
});

export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please enter photo ", 400));

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("deleted");
      });
      return next(new ErrorHandler("Please enter all the fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo?.path,
    });

    // revalidate
    invalidatesCache({ product: true, admin: true });

    return res.status(201).json({
      sucess: true,
      message: "Product Created Successfully",
    });
  }
);

// export const updateProduct = TryCatch(async (req, res, next) => {
//   const { id } = req.params;
//   const { name, price, stock, category } = req.body;
//   const photo = req.file;

//   const product = await Product.findById(id);

//   if (!product) return next(new ErrorHandler("Product Not Found", 404));

//   if (photo) {
//     rm(product.photo!, () => {
//       console.log(" old photo deleted");
//     });
//     product.photo = photo.path;
//   }

//   if (name) product.name = name;
//   if (price) product.price = price;
//   if (stock) product.stock = stock;
//   if (category) product.category = category;

//   await product.save();

//   invalidatesCache({
//     product: true,
//     productId: String(product._id),
//     admin: true,
//   });

//   return res.status(201).json({
//     sucess: true,
//     message: "Product Updated",
//   });
// });

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const photo = req.file;
  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  if (photo) {
    rm(product.photo!, () => {
      console.log("Old Photo Deleted");
    });
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;

  await product.save();

  invalidatesCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found ", 404));

  rm(product.photo!, () => {
    console.log("Product Photo Deleted");
  });

  await product?.deleteOne();
  invalidatesCache({ product: true, productId: String(product._id) });

  return res.status(201).json({
    success: true,
    message: " Product Deleted Successfully",
  });
});

export const getAllProduct = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 9;

    const skip = (page - 1) * limit;
    // suppose we are on the second page want to skip 8 product in that case 2-1=1*limit => 1*9 = 9

    const baseQuery: BaseQuery = {};

    if (search)
      // for searching through names
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    // we use if statement and not if else  because we want to apply all the 3 filter in a single time . We don't want to apply single filter at a time

    // const products = await Product.find(baseQuery)
    //   .sort(
    //     // product with filter sort and limit
    //     sort && { price: sort === "asc" ? 1 : -1 }
    //   )
    //   .limit(limit)
    //   .skip(skip); // limit is using for pagination it will only show the product set in limit

    // const filterdOnlyProduct = await Product.find(baseQuery); //product with filters only

    // the above method can run but not so efficient so we promise to aceess all the await request parallely

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filterdOnlyProduct] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filterdOnlyProduct.length / limit);

    return res.status(201).json({
      sucess: true,
      products,
      totalPage,
    });
  }
);

// for creating fake product while testing the search api

// const generateRandomProduct = async (count: number = 10) => {
//   const products = [];
//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\85409626-1148-4393-8b5c-64fc109fe183.jpg",
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       _v: 0,
//     }
//     products.push(product);
//   }
//   await Product.create(products);
//   console.log({sucess:true})
// };

// generateRandomProduct(40);

// funtion for deleting the random generated products
// const deleteRandomProduct = async(count:number = 10)=>{
//   const products = await Product.find({}).skip(4);

//   for(let i=0; i<products.length; i++){
//     const product = products[i];
//     await product.deleteOne();
//   }
//   console.log({sucess:true})
// }
// deleteRandomProduct()
