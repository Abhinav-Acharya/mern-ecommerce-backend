import express from "express";
import { adminOnly } from "../middlewares/auth.middleware";
import {
  getBarChart,
  getDashboardStats,
  getLineChart,
  getPieChart,
} from "../controllers/stats.controller";

const router = express.Router();

router.get("/stats", adminOnly, getDashboardStats);
router.get("/pie", adminOnly, getPieChart);
router.get("/bar", adminOnly, getBarChart);
router.get("/line", adminOnly, getLineChart);

export default router;
