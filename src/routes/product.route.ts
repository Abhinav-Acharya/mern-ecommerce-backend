import express from "express";
import { adminOnly } from "../middlewares/auth.middleware";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProduct,
  getProductDetails,
  newProduct,
  updateProduct,
} from "../controllers/product.controller";
import { singleUpload } from "../middlewares/multer.middleware";

const router = express.Router();

router.post("/new", adminOnly, singleUpload, newProduct);
router.get("/all", getAllProducts);
router.get("/latest", getLatestProduct);
router.get("/categories", getAllCategories);
router.get("/admin-products", adminOnly, getAdminProducts);
router
  .route("/:id")
  .get(getProductDetails)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default router;
