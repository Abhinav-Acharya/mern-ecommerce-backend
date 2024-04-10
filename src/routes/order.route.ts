import express from "express";
import { adminOnly } from "../middlewares/auth.middleware";
import {
  allOrders,
  deleteOrder,
  getOrderDetails,
  myOrders,
  newOrder,
  processOrder,
} from "../controllers/order.controller";

const router = express.Router();

router.post("/new", newOrder);
router.get("/my", myOrders);
router.get("/all", adminOnly, allOrders);
router
  .route("/:id")
  .get(getOrderDetails)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);

export default router;
