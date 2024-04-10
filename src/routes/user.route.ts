import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUser,
  newUser,
} from "../controllers/user.controller";
import { adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/new", newUser);
router.get("/all", adminOnly, getAllUsers);

router.route("/:id").get(getUser).delete(adminOnly, deleteUser);

export default router;
