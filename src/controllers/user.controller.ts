import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model";
import { INewUserRequestBody } from "../types/types";
import { tryCatch } from "../middlewares/error.middleware";
import ErrorHandler from "../utils/utility-class";

const newUser = tryCatch(
  async (
    req: Request<{}, {}, INewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    let user = await User.findById(_id);

    if (user)
      return res.status(200).json({
        success: true,
        message: `Welcome, ${user.name}`,
      });

    if (!_id || !name || !email || !photo || !gender || !dob)
      next(new ErrorHandler("One of the fields is missing", 400));

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob,
    });

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  }
);

const getAllUsers = tryCatch(async (req, res, next) => {
  const users = await User.find({});

  return res.status(200).json({
    success: true,
    users,
  });
});

const getUser = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("No user found", 400));

  return res.status(200).json({
    success: true,
    user,
  });
});

const deleteUser = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("No user found", 400));

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User deleted succesfully",
  });
});

export { newUser, getAllUsers, getUser, deleteUser };
