import { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/error.middleware";
import {
  IBaseQuery,
  INewProductRequestBody,
  SearchRequestQuery,
} from "../types/types";
import { Product } from "../models/product.model";
import ErrorHandler from "../utils/utility-class";
import { rm } from "fs";
import { myCache } from "../app";
import { invalidateCache } from "../utils/features";
// import { faker } from "@faker-js/faker";

const getAllProducts = tryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { category, price, search, sort } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = limit * (page - 1);

    const baseQuery: IBaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProducts] = await Promise.all([
      await productsPromise,
      await Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProducts.length / limit);

    return res.status(201).json({ success: true, products, totalPage });
  }
);

//revalidate
const getLatestProduct = tryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latest-products")) {
    products = JSON.parse(myCache.get("latest-products") as string);
  } else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(201).json({ success: true, products });
});

//revalidate
const getAllCategories = tryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories") as string);
  } else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  return res.status(201).json({ success: true, categories });
});

//revalidate
const getAdminProducts = tryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("all-products")) {
    products = JSON.parse(myCache.get("all-products") as string);
  } else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

  return res.status(201).json({ success: true, products });
});

const getProductDetails = tryCatch(async (req, res, next) => {
  const id = req.params.id;
  let product;

  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("No product forund", 404));

    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(201).json({ success: true, product });
});

const updateProduct = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("No product forund", 404));

  if (photo) {
    rm(product.photo, () => {
      console.log("Old photo Deleted");
    });
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;

  await product.save();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res
    .status(200)
    .json({ success: true, message: "Product updated successfully" });
});

const deleteProduct = tryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler("No product found", 404));

  rm(product.photo, () => {
    console.log("Product photo Deleted");
  });

  await product.deleteOne();

  invalidateCache({
    product: true,
    admin: true,
    productId: String(product._id),
  });

  return res
    .status(201)
    .json({ success: true, message: "Product deleted successfully" });
});

const newProduct = tryCatch(
  async (
    req: Request<{}, {}, INewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add a photo", 404));

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("Deleted");
      });

      return next(new ErrorHandler("One of the fields is missing", 404));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path,
    });

    invalidateCache({ product: true, admin: true });

    return res
      .status(201)
      .json({ success: true, message: "Product created successfully" });
  }
);

// const deleteRandomProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ success: true });
// };

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];
//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\407b01b3-6bde-4785-ae21-477e7ffa0bfa.jpg",
//       price: faker.commerce.price({ min: 1500, max: 99999, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);
//   console.log({ success: true });
// };

export {
  newProduct,
  getLatestProduct,
  getAllCategories,
  getAdminProducts,
  getProductDetails,
  updateProduct,
  deleteProduct,
  getAllProducts,
};
