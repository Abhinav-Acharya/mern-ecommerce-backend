import { User } from "../models/user.model";
import ErrorHandler from "../utils/utility-class";
import { tryCatch } from "./error.middleware";

export const adminOnly = tryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("You are not logged in", 401));

  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("User not found", 401));

  if (user.role !== "admin")
    return next(new ErrorHandler("You are not an admin", 403));

  next();
});
